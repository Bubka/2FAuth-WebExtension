import { defineStore } from 'pinia'
import { useNotifyStore }  from '@popup/stores/notify'
import { useSettingStore }  from '@/stores/settingStore'
import userService from '@popup/services/userService'

export const usePreferenceStore = defineStore('preferences', () => {

    const notify = useNotifyStore()
    const { t } = useI18n()

    // STATE

    const showOtpAsDot = ref(false)
    const revealDottedOTP = ref(false)
    const closeOtpOnCopy = ref(false)
    const copyOtpOnDisplay = ref(false)
    const clearSearchOnCopy = ref(false)
    const useBasicQrcodeReader = ref(false)
    const displayMode = ref('list')
    const showAccountsIcons = ref(true)
    const activeGroup = ref(0)
    const kickUserAfter = ref(15)
    const rememberActiveGroup = ref(true)
    const viewDefaultGroupOnCopy = ref(false)
    const defaultGroup = ref(0)
    const defaultCaptureMode = ref('livescan')
    const useDirectCapture = ref(false)
    const useWebauthnOnly = ref(false)
    const getOfficialIcons = ref(true)
    const theme = ref('system')
    const formatPassword = ref(true)
    const formatPasswordBy = ref(0.5)
    const lang = ref('browser')
    const getOtpOnRequest = ref(true)
    const notifyOnNewAuthDevice = ref(false)
    const notifyOnFailedLogin = ref(false)
    const timezone = ref('UTC')
    const sortCaseSensitive = ref(false)
    const autoCloseTimeout = ref(2)
    const AutoSaveQrcodedAccount = ref(false)
    const showEmailInFooter = ref(true)
    const showNextOtp = ref(true)

    // ACTIONS

    function $reset() {

        showOtpAsDot.value = false
        revealDottedOTP.value = false
        closeOtpOnCopy.value = false
        copyOtpOnDisplay.value = false
        clearSearchOnCopy.value = false
        useBasicQrcodeReader.value = false
        displayMode.value = 'list'
        showAccountsIcons.value = true
        activeGroup.value = 0
        kickUserAfter.value = 15
        rememberActiveGroup.value = true
        viewDefaultGroupOnCopy.value = false
        defaultGroup.value = 0
        defaultCaptureMode.value = 'livescan'
        useDirectCapture.value = false
        useWebauthnOnly.value = false
        getOfficialIcons.value = true
        theme.value = 'system'
        formatPassword.value = true
        formatPasswordBy.value = 0.5
        lang.value = 'browser'
        getOtpOnRequest.value = true
        notifyOnNewAuthDevice.value = false
        notifyOnFailedLogin.value = false
        timezone.value = 'UTC'
        sortCaseSensitive.value = false
        autoCloseTimeout.value = 2
        AutoSaveQrcodedAccount.value = false
        showEmailInFooter.value = true
        showNextOtp.value = true
    }

    /**
     * Applies the theme persisted in the store
     */
    async function applyTheme() {
        await this.$persistedState.isReady()

        const mode = useColorMode({
            attribute: 'data-theme',
        })

        mode.value = this.theme == 'system' ? 'auto' : this.theme
    }

    /**
     * Applies language
     */
    async function applyLanguage() {
        await this.$persistedState.isReady()
        const { isSupported, language } = useNavigatorLanguage()

        if (isSupported) {
            this.$i18n.global.locale = this.lang == 'browser' ? language.value.slice(0, 2)  : this.lang
        }
        else this.$i18n.global.locale = this.$i18n.fallbackLocale
    }

    /**
     * Resets the group filter to default
     */
    async function resetGroupFilter() {
        await this.$persistedState.isReady()
        if (! this.rememberActiveGroup ) {
            this.activeGroup = 0
        }
    }

    /**
     * Fetch preferences from the backend and update the local store
     */
    function syncWithServer(onlyLockedPreferences = true) {
        userService.getPreferences({returnError: true})
        .then((response) => {
            this.updateWith(response.data, onlyLockedPreferences)
        })
        .catch(() => {
            notify.alert({ text: t('error.data_cannot_be_refreshed_from_server') })
        })
    }

    /**
     * Update the store with the provided preferences
     * 
     * @param {Array<object>} preferences The values to use to update the store
     * @param {Boolean} onlyLockedPreferences Restrict the update to locked preferences only
     */
    function updateWith(preferences, onlyLockedPreferences = true) {
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
    
    return {
        // STATE
        showOtpAsDot,
        revealDottedOTP,
        closeOtpOnCopy,
        copyOtpOnDisplay,
        clearSearchOnCopy,
        useBasicQrcodeReader,
        displayMode,
        showAccountsIcons,
        activeGroup,
        kickUserAfter,
        rememberActiveGroup,
        viewDefaultGroupOnCopy,
        defaultGroup,
        defaultCaptureMode,
        useDirectCapture,
        useWebauthnOnly,
        getOfficialIcons,
        theme,
        formatPassword,
        formatPasswordBy,
        lang,
        getOtpOnRequest,
        notifyOnNewAuthDevice,
        notifyOnFailedLogin,
        timezone,
        sortCaseSensitive,
        autoCloseTimeout,
        AutoSaveQrcodedAccount,
        showEmailInFooter,
        showNextOtp,

        // GETTERS

        // ACTIONS
        $reset,
        applyTheme,
        applyLanguage,
        resetGroupFilter,
        syncWithServer,
        updateWith,
    }
})
