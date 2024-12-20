import { defineStore } from 'pinia'

export const useExtensionStore = defineStore('extensionStore', {

    state: () => {
        return {
            apiToken: '',
            hostUrl: '',
            extPassword: '',
            preferences: {
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
        }
    },

    getters: {
      isConfigured: (state) => state.hostUrl.length > 0 && state.apiToken.length > 0,
      apiTokenPartial: (state) => state.apiToken.substring(0, 10) + ' ... ' + state.apiToken.slice(-10),
    },

    actions: {


        /**
         * Applies the theme persisted in the store
         */
        async applyTheme() {
            await this.$persistedState.isReady()
            const mode = useColorMode({
                attribute: 'data-theme',
            })
            mode.value = this.preferences.theme == 'system' ? 'auto' : this.preferences.theme
        },

        /**
         * Resets the group filter to default
         */
        async resetGroupFilter() {
            await this.$persistedState.isReady()
            if (! this.preferences.rememberActiveGroup ) {
                this.preferences.activeGroup = 0
            }
        },
    },
})
