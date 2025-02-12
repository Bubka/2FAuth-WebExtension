import { defineStore } from 'pinia'

export const usePreferenceStore = defineStore('preferences', {

    state: () => {
        return {
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

            mode.value = this.theme == 'system' ? 'auto' : this.theme
        },

        /**
         * Applies language
         */
        async applyLanguage() {
            await this.$persistedState.isReady()
            const { isSupported, language } = useNavigatorLanguage()

            if (isSupported) {
                this.$i18n.global.locale = this.lang == 'browser' ? language.value.slice(0, 2)  : this.lang
            }
            else this.$i18n.global.locale = this.$i18n.fallbackLocale
        },

        /**
         * Resets the group filter to default
         */
        async resetGroupFilter() {
            await this.$persistedState.isReady()
            if (! this.rememberActiveGroup ) {
                this.activeGroup = 0
            }
        },
        
    },
})
