import { defineStore } from 'pinia'
import { useNotifyStore }  from '@popup/stores/notify'
import { useSettingStore }  from '@/stores/settingStore'
import userService from '@popup/services/userService'

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
            showNextOtp: true,
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

        /**
         * Fetch preferences from the backend and update the local store
         */
        syncWithServer(onlyLockedPreferences = true) {
            const { t } = useI18n()

            userService.getPreferences({returnError: true})
            .then((response) => {
                this.updateWith(response.data, onlyLockedPreferences)
            })
            .catch(() => {
                const notify = useNotifyStore()
                notify.alert({ text: t('error.data_cannot_be_refreshed_from_server') })
            })
        },

        /**
         * Update the store with the provided preferences
         * 
         * @param {Array<object>} preferences The values to use to update the store
         * @param {Boolean} onlyLockedPreferences Restrict the update to locked preferences only
         */
        updateWith(preferences, onlyLockedPreferences = true) {
            const settingStore = useSettingStore()

            preferences.forEach(preference => {
                if (this.$state.hasOwnProperty(preference.key)) {
                    if (!onlyLockedPreferences || preference.locked == true) {
                        this[preference.key] = preference.value
                    }

                    if (preference.key == 'theme') this.applyTheme()
                    if (preference.key == 'lang') this.applyLanguage()
                }

                let index = settingStore.lockedPreferences.indexOf(preference.key)

                if (preference.locked == true && index === -1) {
                    settingStore.lockedPreferences.push(preference.key)
                }
                else if (preference.locked == false && index > 0) {
                    settingStore.lockedPreferences.splice(index, 1)
                }
            })
        }
    },
})
