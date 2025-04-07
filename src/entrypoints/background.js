import { onMessage } from 'webext-bridge/background'

export default defineBackground({

    persistent: false,
    type: 'module', // see https://wxt.dev/guide/essentials/es-modules.html#background

    main() {

        const CRYPTO_STORE = 'cryptoStore'
        const EXTSTATE_STORE = 'extstateStore'
        const PREFERENCE_STORE = 'preferences'

        const decoder = new TextDecoder()
        const encoder = new TextEncoder()
        const _crypto = (typeof window === "undefined") ? crypto : window.crypto

        const default_state = {
            isLoaded: false,
            locked: false,
            lastActiveAt: null,
            kickAfter: null,
            pat: ''
        }

        // Detection of system color scheme 
        if (import.meta.env.MANIFEST_VERSION === 2) {
            // FF & Safari only for now
            const media = window.matchMedia('(prefers-color-scheme: dark)')
            media.addEventListener('change', setPopupIcon)
        }

        browser.runtime.onInstalled.addListener((details) => {
            swlog('Extension installed:', details)
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
        let enable_debug = 'development' == process.env.NODE_ENV
        // let enable_debug = true
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
            swlog('📢 SET_AUTOLOCK_DELAY message received')
            return setAutolockDelay(data.kickAfter)
        })
        onMessage('ENCRYPT_PAT', ({ data }) => {
            swlog('📢 ENCRYPT_PAT message received')
            return encryptPat(data.apiToken)
        })
        onMessage('SET_ENC_KEY', ({ data }) => {
            swlog('📢 SET_ENC_KEY message received')
            return setEncKey(data.password)
        })
        onMessage('CHANGE_ENC_KEY', ({ data }) => {
            swlog('📢 CHANGE_ENC_KEY message received')
            return changeEncKey(data.password)
        })
        onMessage('CHECK_ENC_KEY', ({ data }) => {
            swlog('📢 CHECK_ENC_KEY message received')
            return checkEncKey(data.password)
        })
        onMessage('GET_PAT', () => {
            swlog('📢 GET_PAT message received')
            return getPat()
        })
        onMessage('CHECK_LOCKED', () => {
            swlog('📢 CHECK_LOCKED message received')
            return isLocked()
        })
        onMessage('LOCK_EXTENSION', () => {
            swlog('📢 LOCK_EXTENSION message received')
            return lockNow('popup request')
        })
        onMessage('UNLOCK', () => {
            swlog('📢 UNLOCK message received')
            return unlockExt()
        })
        onMessage('GET_PARTIAL_PAT', () => {
            swlog('📢 GET_PARTIAL_PAT message received')
            return getPartialPat()
        })
        onMessage('RESET_EXT', () => {
            swlog('📢 RESET_EXT message received')
            return resetExt()
        })
        onMessage('GET_EXT_VERSION', () => {
            swlog('📢 GET_EXT_VERSION message received')
            return browser.runtime.getManifest().version
        })

        //  MARK: Loggers
        // /**
        //  * Debug logging
        //  *
        //  * @param logs
        //  */
        async function swlog(...logs) {
            if (enable_debug) {
                console.log('[WORKER]', ...logs)
            }
        }

        /**
         * Write a console log line formated as a title
         * 
         * @param  {...any} logs 
         */
        async function swlogTitle(...logs) {
            swlog('### ' + logs + ' ###')
        }

        //  MARK: Icon
        /**
         * Init the popup icon based on active color scheme
         */
        function setPopupIcon() {
            detectDarkScheme().then((isDark) => {    
                const scheme = isDark ? 'dark' : 'light'
                const iconRes = {
                    path: {
                        16: `icon-16-${scheme}.png`,
                        32: `icon-32-${scheme}.png`,
                        64: `icon-64-${scheme}.png`,
                    }
                }

                if (import.meta.env.MANIFEST_VERSION === 2) {
                    browser.browserAction.setIcon(iconRes)
                }
                else {
                    browser.action.setIcon(iconRes)
                }
            })
        }

        //  MARK: Theme
        /**
         * Tells if dark color scheme is On
         * 
         * @returns {boolean}
         */
        async function detectDarkScheme() {
            if (import.meta.env.MANIFEST_VERSION === 2) {
                // FF & Safari
                return Promise.resolve(window.matchMedia('(prefers-color-scheme: dark)').matches)
            }
            else {
                // Chrome, Edge, Opera
                if (browser.offscreen != null) {
                    await browser.offscreen.createDocument({
                        url: 'offscreen.html',
                        reasons: ['MATCH_MEDIA'],
                        justification: 'get media color scheme',
                    }).catch(() => {})
    
                    const isDark = await browser.runtime.sendMessage('checkDarkTheme')
                    browser.offscreen.closeDocument()
    
                    return isDark
                }
                else {
                    // fallback
                    return Promise.resolve(true)
                }
            }
        }

        //  MARK: Events
        
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
            swlog('== ALARM HANDLING ==')
            if (alarm.name === 'lock-extension') {
                swlog('⏰ lock-extension alarm triggered after ' + (Date.now() - state.lastActiveAt) / 1000 + ' seconds')
                if (state.isLoaded) {
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
            swlogTitle('ON CONNECT HANDLING')
            if (state.isLoaded === false) {
                handleStartup()
            }
            else {
                if (state.locked) {
                    lockNow('handleStartup()')
                }
                else {
                    storeState().then(() => {
                        browser.alarms.clear('lock-extension').then((cleared) => {
                            if (cleared) swlog('⏰ lock-extension alarm cleared by handleOnConnect()')
                        })
                    })
                }
            }
            externalPort.onDisconnect.addListener(handleClose)
        }

        /**
         * Detect the system state change
         * MARK: On sys change
         */
        function handleSystemStateChange(new_state) {
            swlogTitle('SYSTEM CHANGE HANDLING')
            function checkLockState() {
                if (state.kickAfter !== null && state.kickAfter !== -1) {
                    lockNow('handleSystemStateChange()')
                }
            }

            swlog('System switched to ' + new_state)
            if (new_state === 'locked') {
                if (state.isLoaded) {
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
            swlogTitle('STARTUP HANDLING')
            setPopupIcon()
            loadState().then(() => {
                if (state.locked) {
                    lockNow('handleStartup()')
                }
                else {
                    storeState().then(() => {
                        browser.alarms.clear('lock-extension').then((cleared) => {
                            if (cleared) swlog('⏰ lock-extension alarm cleared by handleStartup()')
                        })
                    })
                }
            })
        }

        /**
         * Handle update tasks
         * MARK: On update
         */
        async function handleUpdates(details) {
            swlogTitle('UPDATES HANDLING')
            // if (details.reason === 'update') {
            // }
            handleStartup()
        }

        /**
         * Handle close events
         * MARK: On close
         */
        function handleClose() {
            swlogTitle('CLOSE HANDLING')
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
            swlog('🖫 Storing state')
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
                    state.isLoaded = true
                    swlog('State loaded (from store)')
                    
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
         * Populate the workers state with default values
         * MARK: loadDefaultState()
         *
         * @returns {Promise<boolean>}
         */
        function loadDefaultState() {
            state = { ...default_state }
            swlog('State loaded (from defaults)')

            return getKickAfterFromPreferences().then(() => {
                // if (state.kickAfter !== null) {
                //     state.locked = true
                // }
                return storeState(false).then(() => {
                    return false
                })
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
                        swlog('kickAfter set from preferences to ' + state.kickAfter)
                    }
                    return true
                }
                else {
                    if (state.pat) {
                        state.kickAfter = 15
                        swlog('kickAfter defaulting to 15')
                    }
                    else {
                        // state.kickAfter = null
                        swlog('kickAfter unchanged (= ' + state.kickAfter + ')')
                    }
                    return true
                }
            }, () => false)
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
                browser.alarms.clear('lock-extension').then((cleared) => {
                    if (cleared) swlog('⏰ lock-extension alarm cleared by lockNow()')
                })
            })
        }

        /**
         * Enable the lock timer
         * MARK: startLockTimer()
         */
        function startLockTimer() {
            if (state.locked) {
                swlog('⏰ No need of lock timer: Extension already locked')
            }
            else if (state.kickAfter !== null && state.kickAfter !== 'null') {
                const kickAfter = parseInt(state.kickAfter)
                if (kickAfter > 0) {
                    browser.alarms.create('lock-extension', { delayInMinutes: kickAfter })
                    swlog('⏰ lock-extension alarm started for ' + kickAfter + ' minutes from ' + state.lastActiveAt)
                }
                else swlog('⏰ No need of lock timer (kickAfter = ' + state.kickAfter + ')')
                // else if (kickAfter === 0) {
                //     lockNow('startLockTimer()')
                // }
            }
            else swlog('⏰ kickAfter is null, exiting startLockTimer without creating a lock timer')
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
            return Promise.resolve({ status: true, partialPat: state.pat.substring(0, 16) + ' ... ' + state.pat.slice(-16) })
        }


        /**
         * Check if the extension is currently or should be locked
         * MARK: isLocked()
         *
         * @returns {Promise<{[p: string]: any} | {locked: boolean}>}
         */
        function isLocked() {
            swlogTitle('CHECKING LOCK STATE')
            // This is triggered each time the extension loads, so we will use it as a point to load/generate the salt and iv for encryption
            return loadState().then(() => {
                return browser.storage.local.get({ [CRYPTO_STORE]: null }).then(stores => {
                    if (stores && stores.hasOwnProperty(CRYPTO_STORE) && stores[CRYPTO_STORE]) {
                        encryptionParams.iv = new Uint8Array(stores[CRYPTO_STORE].iv)
                        encryptionParams.salt = new Uint8Array(stores[CRYPTO_STORE].salt)
                        encryptionParams.default = stores[CRYPTO_STORE].default ?? true
                        swlog('Crypto params loaded from store')
                        return new Promise(resolve => resolve())
                    } else {
                        swlog('No crypto store')
                        return generateNewCryptoParams(true)
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
                            swlog('Extension identified as locked 🔒 (with default encryption params)')
                            return return_value
                        })
                    } else {
                        swlog('Extension identified as ' + (return_value.locked ? 'locked 🔒' : 'unlocked 🔓'))
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
            swlogTitle('RESETTING EXTENSION')

            encryptionParams = {
                salt: null,
                iv: null,
                default: true
            }
            state.locked = false
            state.lastActiveAt = null
            state.kickAfter = null
            state.pat = ''

            browser.storage.local.clear().then(() => {
                return generateNewCryptoParams(true).then(() => {
                        return storeState().then(() => {
                            swlog('✔️ Extension reset done')
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
            swlogTitle('UNLOCKING EXTENSION')

            return browser.storage.local.get({ [CRYPTO_STORE]: {} }).then(stores => {
                if (stores && stores.hasOwnProperty(CRYPTO_STORE) && stores[CRYPTO_STORE]) {
                    // encryptionParams should already be fed during the popup opening but
                    // it's not always true, for example under Vivaldi after the first lock.
                    // So we enforce the parameters
                    encryptionParams.iv = new Uint8Array(stores[CRYPTO_STORE].iv)
                    encryptionParams.salt = new Uint8Array(stores[CRYPTO_STORE].salt)
                    encryptionParams.default = stores[CRYPTO_STORE].default ?? true
                    swlog('Crypto params loaded from store')
                } else {
                    swlog('❌ Cannot unlock: Failed to retrieve crypto store data')
                    return { status: false, reason: 'error.failed_to_retrieve_encryption_store_data' }
                }
                
                state.pat = stores[CRYPTO_STORE]['encryptedApiToken'] || ''

                return getEncKey().then(_encryptionKey => {
                    return deriveKey(_encryptionKey, encryptionParams.salt).then(derivatedKey => {
                        return decryptPat(state.pat, derivatedKey).then(decipheredPat => {
                            swlog('🔃 ✔️ Decrypted')
                            state.pat = decipheredPat
                            state.locked = false
                            swlog('🔓 Extension is now unlocked')
                            return storeState().then(() => {
                                return browser.alarms.clear('lock-extension').then((cleared) => {
                                    if (cleared) swlog('⏰ lock-extension alarm cleared by UnlockExt() at ' + state.lastActiveAt)
                                    return { status: true }
                                }, () => {
                                    return { status: true }
                                })
                            })
                        }, (result) => {
                            swlog('🔃 ❌ decryptPat() rejected: ' + result)
                            return { status: false, reason: 'error.failed_to_decipher_pat' }
                        })
                    }, () => {
                        swlog('🔀 ❌ Cannot unlock: Couldn\'t derive key')
                        return { status: false, reason: 'error.failed_to_derive_key' }
                    })
                }, () => {
                    swlog('🔑 ❌ Cannot unlock: Couldn\'t get encryption key')
                    return { status: false, reason: 'error.failed_to_get_password' }
                })
            }, () => {
                swlog('♻️ ❌ Cannot unlock: Failed to load crypto params')
                return { status: false, reason: 'error.failed_to_load_settings' }
            })
        }
        /**
         * Check the given password is the current encryption key
         * MARK: checkEncKey()
         *
         * @param key
         * @returns {Promise<{[p: string]: any} | {status: boolean}>}
         */
        function checkEncKey(key) {
            swlogTitle('CHECKING ENCRYPTION KEY')

            return browser.storage.local.get({ [CRYPTO_STORE]: {} }).then(stores => {
                if (!stores || stores.hasOwnProperty(CRYPTO_STORE) === false) {
                    swlog('❌ Cannot check enc key: Failed to retrieve crypto store data')
                    return { status: false, reason: 'error.failed_to_retrieve_encryption_store_data' }
                }
                // if (stores && stores.hasOwnProperty(CRYPTO_STORE) && stores[CRYPTO_STORE]) {
                //     encryptionParams.iv = new Uint8Array(stores[CRYPTO_STORE].iv)
                //     encryptionParams.salt = new Uint8Array(stores[CRYPTO_STORE].salt)
                //     encryptionParams.default = stores[CRYPTO_STORE].default ?? true
                //     swlog('Crypto params loaded from store')
                // } else {
                //     swlog('❌ Cannot check enc key: Crypto store is missing')
                //     return { status: false, reason: 'error.failed_to_retrieve_encryption_store_data' }
                // }
                
                const _pat = stores[CRYPTO_STORE]['encryptedApiToken'] || ''

                return deriveKey(key, encryptionParams.salt).then(derivatedKey => {
                    return decryptPat(_pat, derivatedKey).then(() => {
                        return { status: true }
                    }, () => {
                        return { status: false }
                    })
                }, () => {
                    return { status: false }
                })
            }, () => {
                return { status: false }
            })
        }

        /**
         * Set the encryption key to be used by unlockExt
         * MARK: setEncKey()
         *
         * @param key
         * @returns {Promise<{status: boolean}>}
         */
        function setEncKey(key) {
            swlogTitle('SETTING ENC KEY')
            // swlog('Setting enc key')
            // swlog('  incoming key length = ' + key?.length)
            encryptionKey = key
            // swlog('  stored key length = ' + encryptionKey?.length)
            swlog('🔑 ✔️ Encryption key set')
            return Promise.resolve({ status: true })
        }

        /**
         * Get the currently stored encryption key
         * MARK: getEncKey()
         *
         * @returns {Promise<{[p: string]: any}>}
         */
        function getEncKey() {
            return Promise.resolve(encryptionKey)
        }

        /**
         * Generate new encryption iv + salt
         * MARK: generateNewCryptoParams()
         *
         * @param set_default
         * @returns {Promise<void>}
         */
        function generateNewCryptoParams(set_default = false) {
            swlog('♻️ Generating new crypto params...')

            let _iv = _crypto.getRandomValues(new Uint8Array(12))
            let _salt = _crypto.getRandomValues(new Uint8Array(16))

            // Store the generated salt + iv (the iv is re-generated every time the pat is encrypted)
            return browser.storage.local.set({
                [CRYPTO_STORE]: {
                    iv: Array(...new Uint8Array(_iv)),
                    salt: Array(...new Uint8Array(_salt)),
                    default: set_default,
                    encryptedApiToken: '',
                }
            }).then(data => {
                encryptionParams.iv = _iv
                encryptionParams.salt = _salt
                encryptionParams.default = set_default

                swlog('♻️ ✔️ Crypto params set and stored (default = ' + set_default + ')')
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
        function changeEncKey(key) {
            swlogTitle('CHANGING ENCRYPTION KEY')
            return generateNewCryptoParams().then(
                () => setEncKey(key)
            ).then(
                () => {
                    swlog('🔑 ✔️ Encryption key changed')
                    return encryptPat(state.pat)
                },
                () => {
                    swlog('🔑 ❌ Failed to set encryption key')
                    return { status: false, encryptedApiToken: null, reason: 'error.failed_to_set_enc_key' }
                }
            )
        }

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
                            return Promise.reject('Error during decoder.decode(): ' + e.message)
                        }
                    }, (ex) => Promise.reject('Error during subtle.decrypt(): ' + ex))
                } catch (e) {
                    return Promise.reject('Error during decrypt: ' + e.message)
                }
            }

            return Promise.reject('Cannot decrypt: missing password or cipherText')
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
            swlogTitle('ENCRYPTING PAT')

            try {
                return deriveKey(encryptionKey, encryptionParams.salt).then(derivatedKey => {
                    swlog('🔃 Regenerating encryption iv...')

                    encryptionParams.iv = _crypto.getRandomValues(new Uint8Array(12))
                    encryptionParams.default = derivatedKey === null
                    const ivArray = Array(...new Uint8Array(encryptionParams.iv))
                    const saltArray = Array(...new Uint8Array(encryptionParams.salt))

                    let _cryptoParams = {
                        iv: ivArray,
                        salt: saltArray,
                        default: encryptionParams.default,
                        encryptedApiToken: ''
                    }

                    return browser.storage.local.set({
                        [CRYPTO_STORE]: _cryptoParams
                    }).then(() => {
                        swlog('🔃 ✔️ iv regenerated')
                        swlog('🔃 Encrypting PAT...')

                        return _crypto.subtle.encrypt({
                            name: "AES-GCM", iv: encryptionParams.iv
                        }, derivatedKey, encoder.encode(apiToken).buffer).then(ciphertext => {
                            swlog('🔃 ✔️ PAT encrypted')

                            _cryptoParams.encryptedApiToken = Array(...new Uint8Array(ciphertext))

                            return browser.storage.local.set({
                                [CRYPTO_STORE]: _cryptoParams
                            }).then(() => {
                                return { status: true, encryptedApiToken: _cryptoParams.encryptedApiToken }
                            }, () => {
                                swlog('🔃 ❌ Saving encrypted PAT failed)')
                                return { status: false, encryptedApiToken: null, reason: 'error.failed_to_store_encrypted_pat' }
                            })
                        }, () => {
                            swlog('🔃 ❌ Encrypting failed')
                            return { status: false, encryptedApiToken: null, reason: 'error.failed_to_encrypt_pat' }
                        })
                    }, () => {
                        swlog('  failed (encrypting)')
                        return { status: false, encryptedApiToken: null, reason: 'error.failed_to_set_encryption_parameters' }
                    })
                })
            } catch (e) {
                swlog('🔃 ❌ Regenerating encryption iv failed', e)
                reason = 'error.failed_to_regenerate_iv'
            }

            return Promise.resolve({ status: false, encryptedApiToken: null, reason: reason })
        }

        /**
         * Set the lock delay
         * MARK: Set kickAfter
         */
        function setAutolockDelay(delay) {
            swlogTitle('SETTING NEW AUTOLOCK DELAY')
            state.kickAfter = (delay !== null && delay !== 'null') ? parseInt(delay) : null
            swlog('✔️ New autolock delay successfully applied')

            return Promise.resolve({ status: true })
        }
    },
})
