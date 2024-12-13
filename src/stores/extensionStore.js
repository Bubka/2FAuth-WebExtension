import { defineStore } from 'pinia'
import { webextStorageAsync } from '@/stores/webextStorageAsync'

export const useExtensionStore = defineStore('extensionStore', {

    state: () => {
        const state = useStorageAsync(
            '2fauth-webext-store',
            {
                apiToken: '',
                hostUrl: '',
                password: '',
                // user preferences
                showOtpAsDot: false,
                revealDottedOTP: false,
                closeOtpOnCopy: false,
                copyOtpOnDisplay: false,
                clearSearchOnCopy: false,
                useBasicQrcodeReader: false,
                displayMode: 'list',
                showAccountsIcons: true,
                kickUserAfter: 15,
                activeGroup: 0,
                rememberActiveGroup: true,
                viewDefaultGroupOnCopy: false,
                defaultGroup: 0,
                defaultCaptureMode: 'livescan',
                useDirectCapture: false,
                useWebauthnOnly: false,
                getOfficialIcons: true,
                theme: 'system',
                formatPassword: true,
                formatPasswordBy: 0.5,
                lang: 'browser',
                getOtpOnRequest: true,
                notifyOnNewAuthDevice: false,
                notifyOnFailedLogin: false,
                timezone: 'UTC',
                sortCaseSensitive: false,
                autoCloseTimeout: 2,
                AutoSaveQrcodedAccount: false,
                showEmailInFooter: true,
            },
            new webextStorageAsync(),
            { mergeDefaults: true }
        )

        return state
    },

    actions: {

    },
})

