import { defineStore } from 'pinia'

export const useExtensionStore = defineStore('extensionStore', {

    state: () => {
        return {
            apiToken: '',
            hostUrl: '',
            extPassword: '',
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
        }
    },

    getters: {
      isConfigured: (state) => state.hostUrl.length > 0 && state.apiToken.length > 0,
    },

    actions: {

    },
})
