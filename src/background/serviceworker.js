import { sendMessage, onMessage } from 'webext-bridge/background'

// const APP_STORE_KEY = '2fauth-app-settings'
const ENC_STORE_KEY = '2fauth-enc-details'
const STATE_STORE_KEY = '2fauth-state'
const DEBUG_STORE_KEY = '2fauth-debug'
const decoder = new TextDecoder()
const encoder = new TextEncoder()
// const _browser = (typeof browser === "undefined") ? chrome : browser
const _crypto = (typeof window === "undefined") ? crypto : window.crypto
const encryptionKey = null
const default_state = {
    loaded: false,
    locked: true,
    lastActiveAt: null,
    kickAfter: false,
    pat: ''
}

// browser.runtime.onInstalled.addListener((details) => {
//     console.log('Extension installed:', details)
// })

self.onerror = function (message, source, lineno, colno, error) {
    console.info(
        `Error: ${message}\nSource: ${source}\nLine: ${lineno}\nColumn: ${colno}\nError object: ${error}`
    )
}

let enc_details = {
    default: true,
    salt: null,
    iv: null
}
let state = { ...default_state }
let enable_debug = null

// _browser.windows.onRemoved.addListener(handleBrowserClosed);
// _browser.runtime.onStartup.addListener(handleStartup);
// _browser.runtime.onInstalled.addListener(handleUpdates);
// onSuspend.addListener(handleClose);
// _browser.alarms.onAlarm.addListener(handleAlarms);
// _browser.idle.onStateChanged.addListener(handleSystemStateChange)
// _browser.runtime.onConnect.addListener(handleOnConnect);


onMessage('SET_LOCK_DELAY', setLockDelay)
onMessage('ENCRYPT_PAT', encryptPat)
onMessage('GET_PAT', encryptPat)


/**
 * Debug logging
 *
 * @param logs
 */
async function swlog(...logs) {
    if (enable_debug === null) {
        enable_debug = (await browser.storage.local.get(DEBUG_STORE_KEY))[DEBUG_STORE_KEY]
    }
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

/**
 * Detect all browser windows closing and lock extension if required
 *
 * TODO: Needs testing without dev-tools windows open to see if it still triggers ( hint: it doesn't seem to :/ )
 */
// function handleBrowserClosed(window_id) {
//     _browser.windows.getAll().then(window_list => {
//         if (window_list.length === 0) {
//             if (state.kickAfter !== null) {
//                 lockNow();
//             } else {
//                 storeState();
//             }
//         }
//     });
// }


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
// function handleOnConnect(externalPort) {
//     if (state.loaded === false) {
//         handleStartup();
//     }
//     externalPort.onDisconnect.addListener(handleClose);
// }

/**
 * Detect the system state change
 */
// function handleSystemStateChange(new_state) {
//     function checkLockState() {
//         if (state.kickAfter !== null && state.kickAfter !== -1) {
//             lockNow();
//         }
//     }

//     if (new_state === 'locked') {
//         if (state.loaded) {
//             checkLockState();
//         } else {
//             loadState().then(() => {
//                 checkLockState();
//             });
//         }
//     }
// }

/**
 * Handle startup tasks
 */
// function handleStartup() {
//     loadState().then(() => {
//         if (state.kickAfter !== null) {
//             lockNow();
//         }
//     });
// }

/**
 * Handle update tasks
 */
// async function handleUpdates(details) {
//     if (details.reason === 'update') {
//         const prev_version = parseInt(details.previousVersion.replace('.', ''));
//         if (prev_version === 202450) {
//             // Remove the now unused '2fauth-enc-key' storage item.
//             console.log("Removing old 2fauth-enc-key stored value...");
//             await _browser.storage.local.remove('2fauth-enc-key');
//         }
//     }
//     handleStartup();
// }

/**
 * Handle close events
 */
// function handleClose() {
//     storeState().then(() => {
//         setLockTimer()
//     });
// }

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

    return browser.storage.local.set({ [STATE_STORE_KEY]: state }).then(() => true, () => false)
}

/**
 * Load the workers state from storage or populate default values
 *
 * @returns {Promise<{[p: string]: any} | *>}
 */
function loadState() {
    /**
     * Check if the current state warrants manually locking
     */
    // function _checkLock() {
    //     if (state.kickAfter > 0 && state.lastActiveAt !== null && ((Date.now() - state.lastActiveAt) / 60000) > state.kickAfter) {
    //         state.pat = '';
    //         state.locked = true;
    //     }
    // }

    return browser.storage.local.get({ [STATE_STORE_KEY]: null }).then(
        state_data => {
            state = state_data[STATE_STORE_KEY]

            if (state !== null) {
                state.loaded = true
                
                if (state.kickAfter === false) {
                    // This code should not be possible to run but something is causing the kickAfter to reset to its default state sometimes.
                    return browser.storage.local.get({ ['extensionStore']: null }).then(data => {
                        //preferences = data.preferences
                        
                        if (data !== null) {
                            state.kickAfter = data.preferences.kickUserAfter
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
    swlog('Loading default state')

    state = { ...default_state }
    state.kickAfter = null

    return browser.storage.local.get({ ['extensionStore']: null }).then(data => {
        // settings = settings[APP_STORE_KEY]

        if (data !== null) {
            state.kickAfter = (data.preferences.kickUserAfter !== null && data.preferences.kickUserAfter !== 'null') ? parseInt(data.preferences.kickUserAfter) : null

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
// function lockNow() {
//     swlog('Locking extension');
//     state.locked = true;
//     state.pat = '';
//     storeState().then(() => {
//         // Clear the encryption key
//         encryptionKey = null;
//         // Clear the alarm so it doesn't fire again
//         _browser.alarms.clear('lock-extension');
//     })
// }

/**
 * Enable the lock timer
 */
// function setLockTimer() {
//     if (state.kickAfter !== null && state.kickAfter !== 'null') {
//         const kickAfter = parseInt(state.kickAfter);
//         if (kickAfter > 0) {
//             _browser.alarms.create('lock-extension', { delayInMinutes: kickAfter });
//         } else if (kickAfter === 0) {
//             lockNow();
//         }
//     }
// }

/**
 * Get the Personal Access Token
 *
 * @returns {Promise<Awaited<{pat: string, status: boolean}>>}
 */
function getPat() {
    return Promise.resolve({ status: true, pat: state.pat });
}

/**
 * Check if the extension is currently or should be locked
 *
 * @returns {Promise<{[p: string]: any} | {locked: boolean}>}
 */
// function isLocked() {
//     // This is triggered each time the extension loads, so we will use it as a point to load/generate the salt and iv for encryption
//     return loadState().then(() => {
//         return _browser.storage.local.get({ [ENC_STORE_KEY]: null }).then(details => {
//             if (details && details.hasOwnProperty(ENC_STORE_KEY) && details[ENC_STORE_KEY]) {
//                 enc_details.iv = new Uint8Array(details[ENC_STORE_KEY].iv);
//                 enc_details.salt = new Uint8Array(details[ENC_STORE_KEY].salt);
//                 enc_details.default = details[ENC_STORE_KEY].default ?? true;
//                 return new Promise(resolve => resolve())
//             } else {
//                 return generateEncDetails(true);
//             }
//         }, () => new Promise(resolve => resolve()));
//     }).then(() => {
//         return _browser.storage.local.get({ [APP_STORE_KEY]: {} }).then(settings => {
//             let return_value = { locked: false };

//             // The extension can only be locked if there is a PAT present in the settings and the user has set a password
//             if (settings.hasOwnProperty(APP_STORE_KEY) && settings[APP_STORE_KEY].hasOwnProperty('encryptedPat')) {
//                 return_value.locked = settings[APP_STORE_KEY]['encryptedPat'].length > 0 && state.locked === true;
//             }
//             // If the user has not set a password and locked is true, unlock the PAT using a null key
//             if (return_value.locked === true && enc_details.default === true) {
//                 return unlockExt().then(status => {
//                     return_value.locked = false;
//                     return return_value;
//                 })
//             } else {
//                 return return_value;
//             }
//         }, () => {
//             return { locked: false };
//         });
//     });
// }

/**
 * Reset the extension
 *
 * @returns {Promise<unknown>}
 */
// function resetExt() {
//     swlog('Resetting extension');
//     enc_details = {
//         salt: null, iv: null, default: true
//     };
//     state.locked = false;
//     state.kickAfter = null;
//     state.pat = '';

//     return new Promise(resolve => resolve());
// }

/**
 * Attempt to unlock the extension
 *
 * @returns {Promise<{[p: string]: any} | {status: boolean}>}
 */
// function unlockExt() {
//     swlog('Unlocking extension')
//     return _browser.storage.local.get({ [APP_STORE_KEY]: {} }).then(settings => {
//         if (!settings || settings.hasOwnProperty(APP_STORE_KEY) === false) {
//             swlog('  failed (unlocking extension) - settings not loaded');
//             return { status: true };
//         }
//         state.pat = settings[APP_STORE_KEY]['encryptedPat'] || '';
//         return getEncKey().then(key_to_use => {
//             return deriveKey(key_to_use, enc_details.salt).then(encryptionKey => {
//                 return decryptPat(state.pat, encryptionKey).then(clear_text => {
//                     if (clear_text !== 'decryption error') {
//                         state.pat = clear_text;
//                         state.locked = false;
//                         swlog('  done (unlocking extension)');
//                         return _browser.alarms.clear('lock-extension').then(() => {
//                             return { status: true }
//                         }, () => {
//                             return { status: true }
//                         });
//                     } else {
//                         swlog('  failed (unlocking extension) - decryption error');
//                         return { status: false };
//                     }
//                 }, () => {
//                     swlog('  failed  (unlocking extension) - decryption error');
//                     return { status: false }
//                 });
//             }, () => {
//                 swlog('  failed  (unlocking extension) - couldn\'t derive key');
//                 return { status: false }
//             });
//         }, () => {
//             swlog('  failed  (unlocking extension) - couldn\'t get password');
//             return { status: false }
//         });
//     }, () => {
//         swlog('  failed  (unlocking extension) - failed to load settings');
//         return { status: false }
//     });
// }

/**
 * Set the encryption key to be used by unlockExt
 *
 * @param key
 * @returns {Promise<{status: boolean}>}
 */
// function setEncKey(key) {
//     swlog('Setting enc key');
//     swlog('  incoming key length = ' + key.length);
//     encryptionKey = key;
//     swlog('  stored key length = ' + encryptionKey.length);
//     swlog('  done (setting enc key)');
//     return Promise.resolve({ status: true });
// }

/**
 * Get the currently stored encryption key
 *
 * @returns {Promise<{[p: string]: any}>}
 */
// function getEncKey() {
//     return Promise.resolve(encryptionKey);
// }

/**
 * Generate new encryption iv + salt
 *
 * @param set_default
 * @returns {Promise<void>}
 */
function generateEncDetails(set_default = false) {
    swlog('Generating new encryption iv + salt')

    enc_details.iv = _crypto.getRandomValues(new Uint8Array(12))
    enc_details.salt = _crypto.getRandomValues(new Uint8Array(16))

    if (set_default) {
        enc_details.default = true
    }

    // Store the generated salt + iv (the iv is re-generated every time the pat is encrypted)
    return browser.storage.local.set({
        [ENC_STORE_KEY]: {
            iv: Array(...new Uint8Array(enc_details.iv)),
            salt: Array(...new Uint8Array(enc_details.salt)),
            default: enc_details.default
        }
    }).then(data => {
        swlog('  done (generating new encryption iv + salt)')

        return data
    }, data => {
        swlog('  failed (generating new encryption iv + salt)')

        return data
    })
}

/**
 * Set a new encryption key and re-encrypt PAT using the new key
 *
 * @param key
 * @returns {Promise<* | {encryptedPat: null, status: boolean}>}
 */
// function changeEncKey(key) {
//     swlog('Changing the password');
//     return generateEncDetails().then(
//         () => setEncKey(key)).then(
//             () => {
//                 swlog('  done (changing the password)');
//                 return encryptPat(state.pat)
//             },
//             () => {
//                 swlog('  failed (changing the password)');
//                 return { status: false, encryptedPat: null }
//             }
//         );
// }

/**
 * Decrypt the PAT using the currently stored key
 *
 * @param encryptedPat
 * @param encryptionKey
 * @returns {Promise<Awaited<string>>|Promise<T | string>}
 */
function decryptPat(encryptedPat, encryptionKey) {
    swlog('Decrypting PAT')

    const failedPromise = Promise.resolve('decryption error')

    if (encryptionKey && encryptedPat) {
        try {
            return _crypto.subtle.decrypt({
                name: "AES-GCM", iv: enc_details.iv
            }, encryptionKey, new Uint8Array(encryptedPat)).then(decodedBuffer => {
                try {
                    const decoded = decoder.decode(new Uint8Array(decodedBuffer))
                    swlog('  done (decrypting pat)')

                    return decoded
                } catch (e) {
                    swlog('  failed (decrypting pat)', e)

                    return failedPromise
                }
            }, () => failedPromise)
        } catch (e) {
            swlog('  failed (decrypting pat)', e)

            return failedPromise
        }
    }

    swlog('  failed (decrypting pat)', 'missing password or encryptedPat')

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
    swlog('Deriving encryption key')

    return _crypto.subtle.importKey("raw", encoder.encode(key), "PBKDF2", false, ["deriveBits", "deriveKey"]).then(
        key_material => {
            return _crypto.subtle.deriveKey({
                name: "PBKDF2", salt: encoder.encode(salt), iterations: 100000, hash: "SHA-256"
            }, key_material, {
                name: "AES-GCM", length: 256
            }, true, ["encrypt", "decrypt"])
        }
    ).then(data => {
        swlog('  done (deriving encryption key)')

        return data
    }, data => {
        swlog('  failed (deriving encryption key)')

        return data
    })
}

/**
 * Encrypt the PAT using the currently stored encryption key
 *
 * @returns {Promise<{[p: string]: any}>}
 */
function encryptPat({ data }) {
    try {
        swlog('Encrypting PAT')

        return deriveKey(encryptionKey, enc_details.salt).then(encryptionKey => {
            swlog('  Regenerating encryption iv...')

            enc_details.iv = _crypto.getRandomValues(new Uint8Array(12))
            enc_details.default = encryptionKey === null

            return browser.storage.local.set({
                [ENC_STORE_KEY]: {
                    iv: Array(...new Uint8Array(enc_details.iv)),
                    salt: Array(...new Uint8Array(enc_details.salt)),
                    default: enc_details.default
                }
            }).then(() => {
                swlog('  done (regenerating encryption iv)')
                swlog('  Encrypting...')

                return _crypto.subtle.encrypt({
                    name: "AES-GCM", iv: enc_details.iv
                }, encryptionKey, encoder.encode(data.pat_clear).buffer).then(ciphertext => {
                    swlog('  done (encrypting)')

                    return { status: true, encryptedPat: Array(...new Uint8Array(ciphertext)) }
                }, () => {
                    swlog('  failed (encrypting)')

                    return { status: false, encryptedPat: null }
                })
            }, () => {
                swlog('  failed (encrypting)')

                return { status: false, encryptedPat: null }
            })
        })
    } catch (e) {
        swlog('  failed (regenerating encryption iv)', e)
    }

    return Promise.resolve({ status: false, encryptedPat: null })
}

/**
 * Set the lock type
 */
function setLockDelay({ data }) {
    swlog('Request for new autolock delay')
    state.kickAfter = (data.delay !== null && data.delay !== 'null') ? parseInt(data.delay) : null
    swlog('New autolock delay successfully applied')

    return Promise.resolve({ status: true })
}
