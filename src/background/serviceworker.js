import { onMessage } from 'webext-bridge/background'

const CRYPTO_STORE = 'cryptoStore'
const EXTSTATE_STORE = 'extstateStore'
const PREFERENCE_STORE = 'preferences'
const BACKGROUND_LOG = 'backgroundLog'

const decoder = new TextDecoder()
const encoder = new TextEncoder()
const _crypto = (typeof window === "undefined") ? crypto : window.crypto

const default_state = {
    loadedFromStore: false,
    locked: false,
    lastActiveAt: null,
    kickAfter: null,
    pat: ''
}

browser.runtime.onInstalled.addListener((details) => {
    console.log('Extension installed:', details)
})

self.onerror = function (message, source, lineno, colno, error) {
    console.error(
        `Error: ${message}\nSource: ${source}\nLine: ${lineno}\nColumn: ${colno}\nError object: ${error}`
    )
}

let encryptionParams = {
    default: true,
    salt: null,
    iv: null
}
let state = { ...default_state }
let enable_debug = true
let encryptionKey = null

//  MARK: Listeners
// Lancer quand une fenêtre est fermée.
browser.windows.onRemoved.addListener(handleBrowserClosed)

// Lancé quand un profil ayant cette extension installée démarre une session
browser.runtime.onStartup.addListener(handleStartup)

// Lancé lorsque l'extension est installée pour la première fois,
// lorsque l'extension est mise à jour vers une nouvelle version
// et lorsque le navigateur est mis à jour vers une nouvelle version.
browser.runtime.onInstalled.addListener(handleUpdates)

// Envoyé sur la page de l'événement juste avant son déchargement.
// Cela donne à l'extension l'opportunité de faire un peu de nettoyage.
// Notez que, comme la page est en cours de déchargement, les opérations asynchrones
// démarrées lors de la gestion de cet événement ne sont pas garanties.
browser.runtime.onSuspend.addListener(handleClose)

// Cet évènement est déclenché lorsque l'alarme se déclenche.
browser.alarms.onAlarm.addListener(handleAlarms)

// Lancé lorsque le système change passe à l'état actif, inactif ou vérouillé. L'écouteur d'événement reçoit une chaîne qui a l'une des trois valeurs suivantes :
//     "vérouillé" si l'écran est vérouillé ou si l'économisateur d'écran s'active
//     "inactif" si le système est vérouillé ou si l'économisateur n'a généré aucune entrée pendant un nombre de secondes spécifié. Ce nombre est défini par défaut sur 60, mais peut-être défini à l'aide de idle.setDetectionInterval().
//     "actif" quand l'utilisateur génère une entrée sur un système inactif.
browser.idle.onStateChanged.addListener(handleSystemStateChange)

// Lancé quand une connexion est établie avec un processus d'extension ou un script de contenu.
browser.runtime.onConnect.addListener(handleOnConnect)


// MARK: Messages
onMessage('SET_AUTOLOCK_DELAY', ({ data }) => {
    return setAutolockDelay(data.kickAfter)
})
onMessage('ENCRYPT_PAT', ({ data }) => {
    return encryptPat(data.apiToken)
})
onMessage('SET_ENC_KEY', ({ data }) => {
    return setEncKey(data.password)
})
onMessage('GET_PAT', getPat)
onMessage('CHECK_LOCKED', isLocked)
onMessage('LOCK_EXTENSION', () => {
    return lockNow('popup request')
})
onMessage('UNLOCK', unlockExt)
onMessage('GET_PARTIAL_PAT', getPartialPat)
onMessage('RESET_EXT', resetExt)

//  MARK: Loggers
// /**
//  * Debug logging
//  *
//  * @param logs
//  */
async function swlog(...logs) {
    if (enable_debug) {
        console.log('[2FAuth-SW]', ...logs)
    }
}

// /**
//  * Background logging
//  *
//  * @param logs
//  */
async function bglog(log) {
    let backgroundLog = (await browser.storage.local.get(BACKGROUND_LOG))[BACKGROUND_LOG] ?? []
    backgroundLog.push(log)
    browser.storage.local.set({ [BACKGROUND_LOG]: backgroundLog })
}

/**
 * Detect all browser windows closing and lock extension if required
 * MARK:On browser close
 *
 * TODO: Needs testing without dev-tools windows open to see if it still triggers ( hint: it doesn't seem to :/ )
 */
function handleBrowserClosed(window_id) {
    browser.windows.getAll().then(window_list => {
        if (window_list.length === 0) {
            // bglog('Browser closing triggered')
            if (state.kickAfter !== null) {
                lockNow('handleBrowserClosed()')
            } else {
                storeState()
            }
        }
    })
}


/**
 * Handle the lock timeout alarm
 * MARK: On alarm
 */
function handleAlarms(alarm) {
    if (alarm.name === 'lock-extension') {
        if (state.loadedFromStore) {
            lockNow('handleAlarms()')
        } else {
            loadState().then(() => {
                lockNow('handleAlarms() after state loading')
            })
        }
    }
}

/**
 * Handle the extension connecting/disconnecting
 * MARK: On connect
 */
function handleOnConnect(externalPort) {
    if (state.loadedFromStore === false) {
        handleStartup()
    }
    externalPort.onDisconnect.addListener(handleClose)
}

/**
 * Detect the system state change
 * MARK: On sys change
 */
function handleSystemStateChange(new_state) {
    function checkLockState() {
        if (state.kickAfter !== null && state.kickAfter !== -1) {
            lockNow('handleSystemStateChange() => new state: ' + new_state)
        }
    }

    if (new_state === 'locked') {
        if (state.loadedFromStore) {
            checkLockState()
        } else {
            loadState().then(() => {
                checkLockState()
            })
        }
    }
}

/**
 * Handle startup tasks
 * MARK: On startup
 */
function handleStartup() {
    loadState().then(() => {
        if (state.kickAfter !== null) {
            lockNow('handleStartup()')
        }
    })
}

/**
 * Handle update tasks
 * MARK: On update
 */
async function handleUpdates(details) {
    // if (details.reason === 'update') {
    // }
    handleStartup()
}

/**
 * Handle close events
 * MARK: On close
 */
function handleClose() {
    storeState().then(() => {
        startLockTimer()
    })
}

/**
 * Save the workers state in storage
 * MARK: storeState()
 *
 * @param update_active
 * @returns {Promise<boolean>}
 */
function storeState(update_active = true) {
    if (update_active) {
        updateLastActivity()
    }

    return browser.storage.local.set({ [EXTSTATE_STORE]: state }).then(() => true, () => false)
}

/**
 * Update the last activity time in the worker state
 */
function updateLastActivity() {
    state.lastActiveAt = Date.now()
}

/**
 * Load the workers state from storage or populate default values
 * MARK: loadState()
 *
 * @returns {Promise<{[p: string]: any} | *>}
 */
function loadState() {
    swlog('🚥 Loading state...')
    /**
     * Check if the current state warrants manually locking
     */
    function _checkLock() {
        if (state.kickAfter > 0 && state.lastActiveAt !== null && ((Date.now() - state.lastActiveAt) / 60000) > state.kickAfter) {
            state.pat = ''
            state.locked = true
        }
    }

    return browser.storage.local.get({ [EXTSTATE_STORE]: null }).then(stores => {
        state = stores[EXTSTATE_STORE]

        if (state !== null) {
            state.loadedFromStore = true
            swlog('🚥   State loaded from store')
            
            // We force reload the kickAfter delay from the preferences store
            return getKickAfterFromPreferences().then(() => {
                _checkLock()
            })
        } else {
            return loadDefaultState()
        }
    },
    () => {
        return loadDefaultState()
    })
}

/**
 * 
 */
function getKickAfterFromPreferences() {
    return browser.storage.local.get({ [PREFERENCE_STORE]: null }).then(stores => {
        const preferencesStore = stores[PREFERENCE_STORE]

        if (preferencesStore !== null) {
            const preferences = JSON.parse(preferencesStore)

            if (preferences !== null) {
                state.kickAfter = (preferences.kickUserAfter !== null && preferences.kickUserAfter !== 'null') ? parseInt(preferences.kickUserAfter) : null
                swlog('🚥   state.kickAfter set from preferences to ' + state.kickAfter)
            }
            return true
        }
        else {
            state.kickAfter = 15 // default value in case the preference store is not yet created
            swlog('🚥   state.kickAfter set to default value (15)')
            return true
        }
    }, () => false)
}

/**
 * Populate the workers state with default values
 * MARK: loadDefaultState()
 *
 * @returns {Promise<boolean>}
 */
function loadDefaultState() {
    state = { ...default_state }
    state.kickAfter = null

    return getKickAfterFromPreferences().then(() => {
        if (state.kickAfter !== null) {
            swlog('🔒 Locked by loadDefaultState()')
            state.locked = true
        }

        return storeState(false).then(() => {
            return false
        })
    })

    // return browser.storage.local.get({ [PREFERENCE_STORE]: null }).then(stores => {
    //     const preferences = stores[PREFERENCE_STORE]

    //     if (preferences !== null) {
    //         swlog(preferences)
    //         state.kickAfter = (preferences.kickUserAfter !== null && preferences.kickUserAfter !== 'null') ? parseInt(preferences.kickUserAfter) : null

    //         if (state.kickAfter !== null) {
    //             swlog('🔒 locked by loadDefaultState()')
    //             state.locked = true
    //         }
    //     }
    //     swlog('>> Default state loaded')

    //     return storeState(false).then(() => {
    //         return false
    //     })
    // },
    // () => {
    //     return storeState(false).then(() => {
    //         return false
    //     })
    // })
}

/**
 * Lock the extension
 * MARK: lockNow()
 */
function lockNow(by = 'unknown') {
    swlog('🔒 locked by ' + by)
    state.locked = true
    state.pat = ''
    storeState().then(() => {
        // Clear the encryption key
        encryptionKey = null
        // Clear the alarm so it doesn't fire again
        browser.alarms.clear('lock-extension')
    })
}

/**
 * Enable the lock timer
 * MARK: startLockTimer()
 */
function startLockTimer() {
    bglog('⏰ Entering startLockTimer...')
    if (state.kickAfter !== null && state.kickAfter !== 'null') {
        const kickAfter = parseInt(state.kickAfter)
        if (kickAfter > 0) {
            browser.alarms.create('lock-extension', { delayInMinutes: kickAfter })
            bglog('⏰ Lock timer started using lock-extension alarm')
        }
        else bglog('⏰ No need of lock timer (kickAfter = ' + state.kickAfter + ')')
        // else if (kickAfter === 0) {
        //     lockNow('startLockTimer()')
        // }
    }
    bglog('⏰ state.kickAfter is null, exiting startLockTimer without creating an alarm')
}

// /**
//  * Get the Personal Access Token
//  *
//  * @returns {Promise<Awaited<{pat: string, status: boolean}>>}
//  */
function getPat() {
    // swlog(state.pat)
    return Promise.resolve({ status: true, pat: state.pat })
}

// /**
//  * Get the Personal Access Token truncated
//  *
//  * @returns {Promise<Awaited<{pat: string, status: boolean}>>}
//  */
function getPartialPat() {
    // swlog(state.pat)
    return Promise.resolve({ status: true, partialPat: state.pat.substring(0, 10) + ' ... ' + state.pat.slice(-10) })
}


/**
 * Check if the extension is currently or should be locked
 * MARK: isLoaded()
 *
 * @returns {Promise<{[p: string]: any} | {locked: boolean}>}
 */
function isLocked() {
    swlog('[CHECKING LOCK STATE]')
    // This is triggered each time the extension loads, so we will use it as a point to load/generate the salt and iv for encryption
    return loadState().then(() => {
        return browser.storage.local.get({ [CRYPTO_STORE]: null }).then(stores => {
            if (stores && stores.hasOwnProperty(CRYPTO_STORE) && stores[CRYPTO_STORE]) {
                encryptionParams.iv = new Uint8Array(stores[CRYPTO_STORE].iv)
                encryptionParams.salt = new Uint8Array(stores[CRYPTO_STORE].salt)
                encryptionParams.default = stores[CRYPTO_STORE].default ?? true
                swlog('📢 Crypto params loaded from store')
                return new Promise(resolve => resolve())
            } else {
                swlog('⚠️ No crypto store')
                return generateCryptoParams(true)
            }
        }, () => new Promise(resolve => resolve()))
    }).then(() => {
        return browser.storage.local.get({ [CRYPTO_STORE]: {} }).then(stores => {
            let return_value = { locked: false }

            // The extension can only be locked if there is a PAT in storage and the user has set a password
            if (stores.hasOwnProperty(CRYPTO_STORE) && stores[CRYPTO_STORE].hasOwnProperty('encryptedApiToken')) {
                return_value.locked = stores[CRYPTO_STORE]['encryptedApiToken'].length > 0 && state.locked === true
            }
            // If the user has not set a password and locked is true, unlock the PAT using a null key
            if (return_value.locked === true && encryptionParams.default === true) {
                return unlockExt().then(status => {
                    return_value.locked = false
                    swlog('📢 Extension identified as locked')
                    return return_value
                })
            } else {
                swlog('📢 Extension identified as unlocked ')
                return return_value
            }
        }, () => {
            return { locked: false }
        })
    })
}

/**
 * Reset the extension
 * MARK: resetExt()
 *
 * @returns {Promise<unknown>}
 */
function resetExt() {
    swlog('~~~ Resetting extension ~~~')

    encryptionParams = {
        salt: null,
        iv: null,
        default: true
    }
    state.locked = false
    state.lastActiveAt = null
    state.kickAfter = false
    state.pat = ''

    browser.storage.local.clear().then(() => {
        return generateCryptoParams(true).then(() => {
                return storeState().then(() => {
                    swlog('  Extension reset done')
                    return new Promise(resolve => resolve())
                
            })
        })
    })
}

/**
 * Attempt to unlock the extension
 * MARK: unlockExt()
 *
 * @returns {Promise<{[p: string]: any} | {status: boolean}>}
 */
function unlockExt() {
    swlog('[UNLOCKING EXTENSION]')

    return browser.storage.local.get({ [CRYPTO_STORE]: {} }).then(stores => {
        if (!stores || stores.hasOwnProperty(CRYPTO_STORE) === false) {
            swlog('  ❌ Cannot unlock: Crypto store is missing')
            return { status: true, reason: 'error.failed_to_get_encryption_parameters' }
        }
        
        // settings = JSON.parse(settings[CRYPTO_STORE])
        // state.pat = settings['encryptedApiToken'] || ''
        state.pat = stores[CRYPTO_STORE]['encryptedApiToken'] || ''

        return getEncKey().then(_encryptionKey => {
            return deriveKey(_encryptionKey, encryptionParams.salt).then(derivatedKey => {
                return decryptPat(state.pat, derivatedKey).then(decipheredPat => {
                    if (! decipheredPat.startsWith('🔃 ❌')) {
                        swlog('🔃 ✔️ Decrypted')
                        state.pat = decipheredPat
                        state.locked = false
                        swlog('🔓 Extension is now unlocked (state.locked = ', state.locked + ')')
                        return storeState().then(() => {
                            return browser.alarms.clear('lock-extension').then(() => {
                                return { status: true }
                            }, () => {
                                return { status: true }
                            })
                        })
                    } else {
                        swlog('  ❌ Cannot unlock: Decryption error')
                        return { status: false, reason: 'error.failed_to_decipher_pat' }
                    }
                }, () => {
                    swlog('  ❌ decryptPat() rejected: Decryption error')
                    return { status: false, reason: 'error.failed_to_decipher_pat' }
                })
            }, () => {
                swlog('  ❌ Cannot unlock: Couldn\'t derive key')
                return { status: false, reason: 'error.failed_to_derive_key' }
            })
        }, () => {
            swlog('  ❌ Cannot unlock: Couldn\'t get password')
            return { status: false, reason: 'error.failed_to_get_password' }
        })
    }, () => {
        swlog('  ❌ Cannot unlock: Failed to load crypto params')
        return { status: false, reason: 'error.failed_to_load_settings' }
    })
}

/**
 * Set the encryption key to be used by unlockExt
 *
 * @param key
 * @returns {Promise<{status: boolean}>}
 */
function setEncKey(key) {
    // swlog('Setting enc key')
    // swlog('  incoming key length = ' + key?.length)
    encryptionKey = key
    // swlog('  stored key length = ' + encryptionKey?.length)
    swlog('🔑 Encryption key set')
    return Promise.resolve({ status: true })
}

/**
 * Get the currently stored encryption key
 *
 * @returns {Promise<{[p: string]: any}>}
 */
function getEncKey() {
    return Promise.resolve(encryptionKey)
}

/**
 * Generate new encryption iv + salt
 * MARK: generateCryptoParams()
 *
 * @param set_default
 * @returns {Promise<void>}
 */
function generateCryptoParams(set_default = false) {
    swlog('♻️ Generating new crypto params...')

    encryptionParams.iv = _crypto.getRandomValues(new Uint8Array(12))
    encryptionParams.salt = _crypto.getRandomValues(new Uint8Array(16))

    if (set_default) {
        encryptionParams.default = true
        swlog('♻️ encryptionParams.default set to true')
    }

    // Store the generated salt + iv (the iv is re-generated every time the pat is encrypted)
    return browser.storage.local.set({
        [CRYPTO_STORE]: {
            iv: Array(...new Uint8Array(encryptionParams.iv)),
            salt: Array(...new Uint8Array(encryptionParams.salt)),
            default: encryptionParams.default,
            encryptedApiToken: '',
        }
    }).then(data => {
        swlog('♻️ ✔️ Crypto params set and stored')
        return data
    }, data => {
        swlog('♻️ ❌ Cannot store crypto params')
        return data
    })
}

/**
 * Set a new encryption key and re-encrypt PAT using the new key
 * MARK: changeEncKey()
 *
 * @param key
 * @returns {Promise<* | {encryptedApiToken: null, status: boolean}>}
 */
// function changeEncKey(key) {
//     swlog('Changing the password')
//     return generateCryptoParams().then(
//         () => setEncKey(key)).then(
//             () => {
//                 swlog('  done (changing the password)')
//                 return encryptPat(state.pat)
//             },
//             () => {
//                 swlog('  failed (changing the password)')
//                 return { status: false, encryptedApiToken: null }
//             }
//         )
// }

/**
 * Decrypt the PAT using the currently stored key
 * MARK: decryptPat()
 *
 * @param cipherText
 * @param encryptionKey
 * @returns {Promise<Awaited<string>>|Promise<T | string>}
 */
function decryptPat(cipherText, encryptionKey) {
    swlog('🔃 Decrypting PAT...')

    // const failedPromise = Promise.resolve('decryption error')

    if (encryptionKey && cipherText) {
        try {
            return _crypto.subtle.decrypt({
                name: "AES-GCM", iv: encryptionParams.iv
            }, encryptionKey, new Uint8Array(cipherText)).then(decodedBuffer => {
                try {
                    const decoded = decoder.decode(new Uint8Array(decodedBuffer))

                    return decoded
                } catch (e) {
                    return Promise.resolve('🔃 ❌ Error during decode: ' + e.message)
                }
            }, () => Promise.resolve('🔃 ❌ Decryption rejected: ' + e.message))
        } catch (e) {
            return Promise.resolve('🔃 ❌ Error during decrypt: ' + e.message)
        }
    }

    return Promise.resolve('🔃 ❌ Cannot decrypt: missing password or cipherText')
}

/**
 * Derive the encryption key from the users password
 * MARK: deriveKey()
 *
 * @param key
 * @param salt
 * @returns {Promise<CryptoKey>}
 */
function deriveKey(key, salt) {
    swlog('🔀 Deriving encryption key...')

    return _crypto.subtle.importKey("raw", encoder.encode(key), "PBKDF2", false, ["deriveBits", "deriveKey"]).then(
        key_material => {
            return _crypto.subtle.deriveKey({
                name: "PBKDF2", salt: encoder.encode(salt), iterations: 100000, hash: "SHA-256"
            }, key_material, {
                name: "AES-GCM", length: 256
            }, true, ["encrypt", "decrypt"])
        }
    ).then(data => {
        swlog('🔀 ✔️ Derived')

        return data
    }, data => {
        swlog('🔀 ❌ Failure')

        return data
    })
}

/**
 * Encrypt the PAT using the currently stored encryption key
 * MARK: encryptPat()
 *
 * @returns {Promise<{[p: string]: any}>}
 */
function encryptPat(apiToken) {
    let reason = 'error.unknown_error_during_pat_encryption'

    try {
        swlog('Encrypting PAT')

        return deriveKey(encryptionKey, encryptionParams.salt).then(derivatedKey => {
            swlog('  Regenerating encryption iv...')

            try {
                encryptionParams.iv = _crypto.getRandomValues(new Uint8Array(12))
                encryptionParams.default = derivatedKey === null

                const ivArray = Array(...new Uint8Array(encryptionParams.iv))
                const saltArray = Array(...new Uint8Array(encryptionParams.salt))

                var _cryptoParams = {
                    iv: ivArray,
                    salt: saltArray,
                    default: encryptionParams.default
                }
            } catch (err) {
                swlog('  failed (encrypting)')
                return { status: false, encryptedApiToken: null, reason: 'error.failed_to_set_encryption_parameters' }
            }

            // return browser.storage.local.set({
            //     [CRYPTO_STORE]: {
            //         iv: ivArray,
            //         salt: saltArray,
            //         default: encryptionParams.default
            //     }
            // }).then(() => {
                swlog('  done (regenerating encryption iv)')
                swlog('  Encrypting...')

                return _crypto.subtle.encrypt({
                    name: "AES-GCM", iv: encryptionParams.iv
                }, derivatedKey, encoder.encode(apiToken).buffer).then(ciphertext => {
                    swlog('  done (encrypting)')

                    _cryptoParams.encryptedApiToken = Array(...new Uint8Array(ciphertext))

                    return browser.storage.local.set({
                        [CRYPTO_STORE]: _cryptoParams
                    }).then(() => {
                        return { status: true, encryptedApiToken: _cryptoParams.encryptedApiToken }
                    }, () => {
                        swlog('  failed (saving encrypted PAT)')
    
                        return { status: false, encryptedApiToken: null, reason: 'error.failed_to_store_encrypted_pat' }
                    })
                }, () => {
                    swlog('  failed (encrypting)')

                    return { status: false, encryptedApiToken: null, reason: 'error.failed_to_encrypt_pat' }
                })
            // }, () => {
            //     swlog('  failed (encrypting)')

            //     return { status: false, encryptedApiToken: null, reason: 'error.failed_to_set_encryption_parameters' }
            // })
        })
    } catch (e) {
        swlog('  failed (regenerating encryption iv)', e)
        reason = 'error.failed_to_regenerate_iv'
    }

    return Promise.resolve({ status: false, encryptedApiToken: null, reason: reason })
}

/**
 * Set the lock delay
 * MARK: Set kickAfter
 */
function setAutolockDelay(delay) {
    swlog('Request for new autolock delay')
    state.kickAfter = (delay !== null && delay !== 'null') ? parseInt(delay) : null
    swlog('New autolock delay successfully applied')

    return Promise.resolve({ status: true })
}
