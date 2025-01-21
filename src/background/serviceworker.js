import { onMessage } from 'webext-bridge/background'

const CRYPTO_STORE = 'cryptoStore'
const EXTSTATE_STORE = 'extstateStore'
const PREFERENCE_STORE = 'preferenceStore'
const BACKGROUND_LOG = 'backgroundLog'

const decoder = new TextDecoder()
const encoder = new TextEncoder()
const _crypto = (typeof window === "undefined") ? crypto : window.crypto

const default_state = {
    loaded: false,
    locked: false,
    lastActiveAt: null,
    kickAfter: false,
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
// browser.alarms.onAlarm.addListener(handleAlarms)

// Lancé lorsque le système change passe à l'état actif, inactif ou vérouillé. L'écouteur d'événement reçoit une chaîne qui a l'une des trois valeurs suivantes :
//     "vérouillé" si l'écran est vérouillé ou si l'économisateur d'écran s'active
//     "inactif" si le système est vérouillé ou si l'économisateur n'a généré aucune entrée pendant un nombre de secondes spécifié. Ce nombre est défini par défaut sur 60, mais peut-être défini à l'aide de idle.setDetectionInterval().
//     "actif" quand l'utilisateur génère une entrée sur un système inactif.
browser.idle.onStateChanged.addListener(handleSystemStateChange)

// Lancé quand une connexion est établie avec un processus d'extension ou un script de contenu.
browser.runtime.onConnect.addListener(handleOnConnect)


// onMessage('SET_LOCK_DELAY', setLockDelay)
onMessage('ENCRYPT_PAT', ({ data }) => {
    return encryptPat(data.apiToken)
})
onMessage('SET_ENC_KEY', ({ data }) => {
    return setEncKey(data.password)
})
onMessage('GET_PAT', getPat)
onMessage('CHECK_LOCKED', isLocked)
onMessage('LOCK_EXTENSION', lockNow)
onMessage('UNLOCK', unlockExt)
onMessage('GET_PARTIAL_PAT', getPartialPat)
onMessage('RESET_EXT', resetExt)


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

// browser.windows.onMessage.addListener(handleMessages)

/**
 * Listen for messages from the extension
 */
// function handleMessages(message, sender, response) {
//     console.log('message', message)
//     console.log('sender', sender)
//     console.log('response', response)
    
//     const message_type = message.type ? message.type : undefined
//     swlog('Got command', message_type)

//     switch (message_type) {
//         case 'LOCK_EXTENSION':
//             lockExtension().then(data => response(data))
//             break
//         // case 'GET-PAT':
//         //     getPat().then(data => response(data));
//         //     break;
//         // case 'CHECK-LOCKED':
//         //     isLocked().then(data => response(data));
//         //     break;
//         // case 'SET-ENC-KEY':
//         //     setEncKey(message.payload).then(data => response(data));
//         //     break;
//         // case 'CHANGE-ENC-KEY':
//         //     changeEncKey(message.payload).then(data => response(data));
//         //     break;
//         // case 'UNLOCK-EXT':
//         //     unlockExt().then(data => response(data));
//         //     break;
//         // case 'ENCRYPT-PAT':
//         //     encryptPat(message.payload).then(data => response(data));
//         //     break;
//         case 'SET_LOCK_DELAY':
//             setLockDelay(message.payload).then(data => response(data));
//             break;
//         // case 'RESET-EXT':
//         //     resetExt().then(data => response(data));
//         //     break;
//         case 'SET_DEBUG':
//             enable_debug = message.payload === 'ON';
//             browser.storage.local.set({ [DEBUG_STORE_KEY]: enable_debug }).then(() => {
//                 response({ status: true, debug_mode: enable_debug })
//             })
//             break
//     }

//     return true
// }
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
                storeState();
            }
        }
    });
}


/**
 * Handle the lock timeout alarm
 */
// function handleAlarms(alarm) {
//     if (alarm.name === 'lock-extension') {
//         if (state.loaded) {
//             lockNow();
//         } else {
//             loadState().then(() => {
//                 lockNow();
//             });
//         }
//     }
// }

/**
 * Handle the extension connecting/disconnecting
 */
function handleOnConnect(externalPort) {
    if (state.loaded === false) {
        handleStartup();
    }
    externalPort.onDisconnect.addListener(handleClose);
}

/**
 * Detect the system state change
 */
function handleSystemStateChange(new_state) {
    function checkLockState() {
        if (state.kickAfter !== null && state.kickAfter !== -1) {
            lockNow('handleSystemStateChange() => new state: ' + new_state)
        }
    }

    if (new_state === 'locked') {
        if (state.loaded) {
            checkLockState()
        } else {
            loadState().then(() => {
                checkLockState()
            });
        }
    }
}

/**
 * Handle startup tasks
 */
function handleStartup() {
    loadState().then(() => {
        // if (state.kickAfter !== null) {
        //     lockNow();
        // }
    });
}

/**
 * Handle update tasks
 */
async function handleUpdates(details) {
    if (details.reason === 'update') {
        const prev_version = parseInt(details.previousVersion.replace('.', ''));
        // if (prev_version === 202450) {
            // Remove the now unused '2fauth-enc-key' storage item.
            console.log("Removing old 2fauth-enc-key stored value...");
            await browser.storage.local.remove('2fauth-enc-key');
        // }
    }
    handleStartup();
}

/**
 * Handle close events
 */
function handleClose() {
    storeState().then(() => {
        // setLockTimer()
    });
}

/**
 * Save the workers state in storage
 *
 * @param update_active
 * @returns {Promise<boolean>}
 */
function storeState(update_active = true) {
    if (update_active) {
        state.lastActiveAt = Date.now()
    }

    return browser.storage.local.set({ [EXTSTATE_STORE]: state }).then(() => true, () => false)
}

/**
 * Load the workers state from storage or populate default values
 *
 * @returns {Promise<{[p: string]: any} | *>}
 */
function loadState() {
    swlog('🚥 Loading state...')
    /**
     * Check if the current state warrants manually locking
     */
    // function _checkLock() {
    //     if (state.kickAfter > 0 && state.lastActiveAt !== null && ((Date.now() - state.lastActiveAt) / 60000) > state.kickAfter) {
    //         state.pat = '';
    //         state.locked = true;
    //     }
    // }

    return browser.storage.local.get({ [EXTSTATE_STORE]: null }).then(
        state_data => {
            state = state_data[EXTSTATE_STORE]

            if (state !== null) {
                state.loaded = true
                
                if (state.kickAfter === false) {
                    // This code should not be possible to run but something is causing the kickAfter to reset to its default state sometimes.
                    return browser.storage.local.get({ [PREFERENCE_STORE]: null }).then(preferences => {
                        //preferences = data.preferences
                        
                        if (preferences !== null) {
                            state.kickAfter = preferences.kickUserAfter
                        }
                        // _checkLock()

                        return true
                    }, () => false)
                } else {
                    // _checkLock()

                    return true
                }
            } else {
                return loadDefaultState()
            }
        },
        () => {
            return loadDefaultState()
        }
    )
}

/**
 * Populate the workers state with default values
 *
 * @returns {Promise<boolean>}
 */
function loadDefaultState() {
    state = { ...default_state }
    state.kickAfter = null

    return browser.storage.local.get({ [PREFERENCE_STORE]: null }).then(preferences => {
        preferences = preferences[PREFERENCE_STORE]

        if (preferences !== null) {
            state.kickAfter = (preferences.kickUserAfter !== null && preferences.kickUserAfter !== 'null') ? parseInt(preferences.kickUserAfter) : null

            // if (state.kickAfter !== null) {
            //     state.locked = true
            // }
        }

        return storeState(false).then(() => {
            return false
        })
    },
    () => {
        return storeState(false).then(() => {
            return false
        })
    })
}

/**
 * Lock the extension
 */
function lockNow(by = 'unknown') {
    swlog('🔒 locked by ' + by)
    state.locked = true
    state.pat = ''
    storeState().then(() => {
        // Clear the encryption key
        encryptionKey = null;
        // Clear the alarm so it doesn't fire again
        // browser.alarms.clear('lock-extension');
    })
}

/**
 * Enable the lock timer
 */
// function setLockTimer() {
//     if (state.kickAfter !== null && state.kickAfter !== 'null') {
//         const kickAfter = parseInt(state.kickAfter);
//         if (kickAfter > 0) {
//             browser.alarms.create('lock-extension', { delayInMinutes: kickAfter });
//         } else if (kickAfter === 0) {
//             lockNow();
//         }
//     }
// }

// /**
//  * Get the Personal Access Token
//  *
//  * @returns {Promise<Awaited<{pat: string, status: boolean}>>}
//  */
function getPat() {
    // swlog(state.pat)
    return Promise.resolve({ status: true, pat: state.pat });
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
 *
 * @returns {Promise<{[p: string]: any} | {locked: boolean}>}
 */
function isLocked() {
    swlog('[CHECKING LOCK STATE]')
    // This is triggered each time the extension loads, so we will use it as a point to load/generate the salt and iv for encryption
    return loadState().then(() => {
        return browser.storage.local.get({ [CRYPTO_STORE]: null }).then(stores => {
            if (stores && stores.hasOwnProperty(CRYPTO_STORE) && stores[CRYPTO_STORE]) {
                encryptionParams.iv = new Uint8Array(stores[CRYPTO_STORE].iv);
                encryptionParams.salt = new Uint8Array(stores[CRYPTO_STORE].salt);
                encryptionParams.default = stores[CRYPTO_STORE].default ?? true;
                swlog('📢 Crypto params loaded from store')
                return new Promise(resolve => resolve())
            } else {
                return generateCryptoParams(true);
                swlog('⚠️ No crypto store')
            }
        }, () => new Promise(resolve => resolve()));
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
                    if (decipheredPat !== 'decryption error') {
                        swlog('🔃 ✔️ Decrypted')
                        state.pat = decipheredPat
                        state.locked = false
                        return  storeState().then(() => {
                            return { status: true }
                        swlog('🔓 Extension is now unlocked (state.locked = ', state.locked + ')')
                        })
                        // return browser.alarms.clear('lock-extension').then(() => {
                        //     return { status: true }
                        // }, () => {
                        //     return { status: true }
                        // })
                    } else {
                        swlog('  ❌ Cannot unlock: Decryption error')
                        return { status: false, reason: 'error.failed_to_decipher_pat' }
                    }
                }, () => {
                    swlog('  ❌ decryptPat() rejected: Decryption error')
                    return { status: false, reason: 'error.failed_to_decipher_pat' }
                });
            }, () => {
                swlog('  ❌ Cannot unlock: Couldn\'t derive key')
                return { status: false, reason: 'error.failed_to_derive_key' }
            });
        }, () => {
            swlog('  ❌ Cannot unlock: Couldn\'t get password')
            return { status: false, reason: 'error.failed_to_get_password' }
        });
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
    return Promise.resolve(encryptionKey);
}

/**
 * Generate new encryption iv + salt
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
 *
 * @param key
 * @returns {Promise<* | {encryptedApiToken: null, status: boolean}>}
 */
// function changeEncKey(key) {
//     swlog('Changing the password');
//     return generateCryptoParams().then(
//         () => setEncKey(key)).then(
//             () => {
//                 swlog('  done (changing the password)');
//                 return encryptPat(state.pat)
//             },
//             () => {
//                 swlog('  failed (changing the password)');
//                 return { status: false, encryptedApiToken: null }
//             }
//         );
// }

/**
 * Decrypt the PAT using the currently stored key
 *
 * @param cipherText
 * @param encryptionKey
 * @returns {Promise<Awaited<string>>|Promise<T | string>}
 */
function decryptPat(cipherText, encryptionKey) {
    swlog('🔃 Decrypting PAT...')

    const failedPromise = Promise.resolve('decryption error')

    if (encryptionKey && cipherText) {
        try {
            return _crypto.subtle.decrypt({
                name: "AES-GCM", iv: encryptionParams.iv
            }, encryptionKey, new Uint8Array(cipherText)).then(decodedBuffer => {
                try {
                    const decoded = decoder.decode(new Uint8Array(decodedBuffer))

                    return decoded
                } catch (e) {

                    return failedPromise
                }
            }, () => failedPromise)
        } catch (e) {
            return failedPromise
        }
    }

    return failedPromise
}

/**
 * Derive the encryption key from the users password
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
 * Set the lock type
 */
// function setLockDelay({ data }) {
//     swlog('Request for new autolock delay')
//     state.kickAfter = (data.delay !== null && data.delay !== 'null') ? parseInt(data.delay) : null
//     swlog('New autolock delay successfully applied')

//     return Promise.resolve({ status: true })
// }
