<script setup>
    import { usePreferenceStore } from '@/stores/preferenceStore'
    import { useSettingStore } from '@/stores/settingStore'
    import { useGroups } from '@popup/stores/groups'
    import SettingTabs from '@popup/layouts/SettingTabs.vue'
    import { useNotify } from '@2fauth/ui'
    import { FormCheckbox, FormSelect, FormToggle } from '@2fauth/formcontrols'

    const { t } = useI18n()
    const router = useRouter()
    const groups = useGroups()
    const notify = useNotify()
    const preferenceStore = usePreferenceStore()
    const settingStore = useSettingStore()
    const kickAfter = ref(preferenceStore.kickUserAfter)

    /**
     * List of preferences used in the extension that are locked on server side 
     */
    const lockedPreferences = computed(() => {
        return [
            'showOtpAsDot',
            'revealDottedOTP',
            'closeOtpOnCopy',
            'copyOtpOnDisplay',
            'clearSearchOnCopy',
            'showAccountsIcons',
            'activeGroup',
            'kickUserAfter',
            'rememberActiveGroup',
            'viewDefaultGroupOnCopy',
            'defaultGroup',
            'theme',
            'formatPassword',
            'formatPasswordBy',
            'lang',
            'getOtpOnRequest',
            'autoCloseTimeout',
            'showNextOtp',
        ].filter(pref => settingStore.lockedPreferences.includes(pref));
    })

    const themes = [
        { text: 'message.light', value: 'light', icon: 'Sun' },
        { text: 'message.dark', value: 'dark', icon: 'Moon' },
        { text: 'message.automatic', value: 'system', icon: 'MonitorCheck' },
    ]
    const passwordFormats = [
        { text: 'message.pair.label', value: 2, legend: 'message.pair', title: 'message.pair.legend' },
        { text: 'message.trio.label', value: 3, legend: 'message.trio', title: 'message.trio.legend' },
        { text: 'message.half.label', value: 0.5, legend: 'message.half', title: 'message.half.legend' },
    ]
    const kickUserAfters = [
        { text: 'message.never', value: 0 },
        { text: 'message.on_otp_copy', value: -1 },
        { text: 'message.one_minutes', value: 1 },
        { text: 'message.five_minutes', value: 5 },
        { text: 'message.ten_minutes', value: 10 },
        { text: 'message.fifteen_minutes', value: 15 },
        { text: 'message.thirty_minutes', value: 30 },
        { text: 'message.one_hour', value: 60 },
        { text: 'message.one_day', value: 1440 }, 
    ]
    const autoCloseTimeout = [
        { text: 'message.never', value: 0 },
        { text: 'message.one_minutes', value: 1 },
        { text: 'message.two_minutes', value: 2 },
        { text: 'message.five_minutes', value: 5 },
    ]
    const groupsList = ref([
        { text: 'message.no_group', value: 0 },
        { text: 'message.active_group', value: -1 },
    ])
    const getOtpTriggers = [
        { text: 'message.otp_generation_on_request', value: true, legend: 'message.otp_generation_on_request.legend', title: 'message.otp_generation_on_request_title' },
        { text: 'message.otp_generation_on_home', value: false, legend: 'message.otp_generation_on_home.legend', title: 'message.otp_generation_on_home_title' },
    ]

    const langs = computed(() => {
        let locales = [{
            text: 'message.browser_preference',
            value: 'browser'
        }];

        let availableLocales = ['en', 'fr']

        for (const locale of availableLocales) {
            locales.push({
                text: 'lang.' + locale,
                value: locale
            })
        }
        return locales
    })

    onMounted(() => {
        groups.items.forEach((group) => {
            if( group.id > 0 ) {
                groupsList.value.push({
                    text: group.name,
                    value: group.id
                })
            }
        })

        preferenceStore.syncWithServer()
    })

    onBeforeRouteLeave((to) => {
        if (! to.name.startsWith('settings.')) {
            notify.clear()
        }
    })

    /**
     * 
     */
    function notifySuccess() {
        notify.success({ type: 'is-success', text: t('message.setting_saved') })
    }

    /**
     * Applies language
     */
    function applyLanguage(lang) {        
        preferenceStore.lang = lang
        preferenceStore.applyLanguage()
        notifySuccess()
    }

    /**
     * Applies theme
     */
    function applyTheme() {
        preferenceStore.applyTheme()
        notifySuccess()
    }

    /**
     * Sets the autolock delay
     */
    async function changeAutolockDelay() {
        const { status } = await sendMessage('SET_AUTOLOCK_DELAY', { kickAfter: kickAfter.value }, 'background')
         
        if (status) {
            preferenceStore.kickUserAfter = kickAfter.value
            notifySuccess()
        }
        else notify.alert({ text: t('error.failed_to_set_autolock_delay') })
    }

    onBeforeRouteLeave((to) => {
        if (! to.name.startsWith('settings.')) {
            notify.clear()
        }
    })

</script>

<template>
    <div>
        <SettingTabs activeTab="settings.options" />
        <div class="options-tabs">
            <form>
                <!-- user preferences -->
                <div class="block">
                    <h4 class="title is-4 has-text-grey-light">{{ $t('message.general') }}</h4>
                    <div v-if="settingStore.hasLockedPreferences && lockedPreferences.length > 0" class="notification is-warning is-size-7">
                        {{ $t('message.settings_managed_by_administrator') }}
                    </div>
                    <!-- Language -->
                    <FormSelect v-model="preferenceStore.lang" @update:model-value="val => applyLanguage(val)" :options="langs" fieldName="lang" :isLocked="settingStore.lockedPreferences.includes('lang')" label="field.language" help="field.language.help" />
                    <!-- <div class="field help">
                        {{ $t('message.some_translation_are_missing') }}
                        <a class="ml-2" @click="openUrlInNewTab('https://crowdin.com/project/2fauth')">
                            <span class="icon-text" style="line-height: inherit">
                                <span>{{ $t('message.help_translate_2fauth') }}</span>
                                <span class="icon is-small"><LucideExternalLink /></span>
                            </span>
                        </a>
                    </div> -->
                    <!-- theme -->
                    <FormToggle v-model="preferenceStore.theme" @update:model-value="applyTheme()" :choices="themes" fieldName="theme" :isLocked="settingStore.lockedPreferences.includes('theme')" label="field.theme" help="field.theme.help"/>
                    <!-- show icon -->
                    <FormCheckbox v-model="preferenceStore.showAccountsIcons" @update:model-value="notifySuccess" fieldName="showAccountsIcons" :isLocked="settingStore.lockedPreferences.includes('showAccountsIcons')" label="field.show_accounts_icons" help="field.show_accounts_icons.help" />
                    <!-- password format -->
                    <FormCheckbox v-model="preferenceStore.formatPassword" @update:model-value="notifySuccess" fieldName="formatPassword" :isLocked="settingStore.lockedPreferences.includes('formatPassword')" label="field.password_format" help="field.password_format.help" />
                    <FormToggle v-model="preferenceStore.formatPasswordBy" @update:model-value="notifySuccess" :choices="passwordFormats" fieldName="formatPasswordBy" :isLocked="settingStore.lockedPreferences.includes('formatPasswordBy')" :isDisabled="!preferenceStore.formatPassword" />
                    <!-- clear search on copy -->
                    <FormCheckbox v-model="preferenceStore.clearSearchOnCopy" @update:model-value="notifySuccess" fieldName="clearSearchOnCopy" :isLocked="settingStore.lockedPreferences.includes('clearSearchOnCopy')" label="field.clear_search_on_copy" help="field.clear_search_on_copy.help" />
                    
                    <h4 class="title is-4 pt-4 has-text-grey-light">{{ $t('message.groups') }}</h4>
                    <!-- default group -->
                    <FormSelect v-model="preferenceStore.defaultGroup" @update:model-value="notifySuccess" :options="groupsList" fieldName="defaultGroup" label="field.default_group" help="field.default_group.help" />
                    <!-- retain active group -->
                    <FormCheckbox v-model="preferenceStore.rememberActiveGroup" @update:model-value="notifySuccess" fieldName="rememberActiveGroup" :isLocked="settingStore.lockedPreferences.includes('rememberActiveGroup')" label="field.remember_active_group" help="field.remember_active_group.help" />
                    <!-- always return to default group after copying -->
                    <FormCheckbox v-model="preferenceStore.viewDefaultGroupOnCopy" @update:model-value="notifySuccess" fieldName="viewDefaultGroupOnCopy" :isLocked="settingStore.lockedPreferences.includes('viewDefaultGroupOnCopy')" label="field.view_default_group_on_copy" help="field.view_default_group_on_copy.help" />
                    
                    <h4 class="title is-4 pt-4 has-text-grey-light">{{ $t('message.security') }}</h4>
                    <!-- auto lock -->
                    <FormSelect v-model="kickAfter" @update:model-value="changeAutolockDelay()" :options="kickUserAfters" fieldName="kickUserAfter" :isLocked="settingStore.lockedPreferences.includes('kickUserAfter')" label="field.auto_lock" help="field.auto_lock.help" />
                    <!-- get OTP on request -->
                    <FormToggle v-model="preferenceStore.getOtpOnRequest" @update:model-value="notifySuccess" :choices="getOtpTriggers" fieldName="getOtpOnRequest" :isLocked="settingStore.lockedPreferences.includes('getOtpOnRequest')" label="field.otp_generation" help="field.otp_generation.help"/>
                        <!-- close otp on copy -->
                        <FormCheckbox v-model="preferenceStore.closeOtpOnCopy" @update:model-value="notifySuccess" fieldName="closeOtpOnCopy" :isLocked="settingStore.lockedPreferences.includes('closeOtpOnCopy')" :isDisabled="!preferenceStore.getOtpOnRequest" label="field.close_otp_on_copy" help="field.close_otp_on_copy.help" :isIndented="true" />
                        <!-- auto-close timeout -->
                        <FormSelect v-model="preferenceStore.autoCloseTimeout" @update:model-value="notifySuccess" :options="autoCloseTimeout" :isLocked="settingStore.lockedPreferences.includes('autoCloseTimeout')" :isDisabled="!preferenceStore.getOtpOnRequest" fieldName="autoCloseTimeout" label="field.auto_close_timeout" help="field.auto_close_timeout.help" :isIndented="true" />
                        <!-- clear search on copy -->
                        <FormCheckbox v-model="preferenceStore.copyOtpOnDisplay" @update:model-value="notifySuccess" fieldName="copyOtpOnDisplay" :isLocked="settingStore.lockedPreferences.includes('copyOtpOnDisplay')" :isDisabled="!preferenceStore.getOtpOnRequest" label="field.copy_otp_on_display" help="field.copy_otp_on_display.help" :isIndented="true" />
                    <!-- otp as dot -->
                    <FormCheckbox v-model="preferenceStore.showOtpAsDot" @update:model-value="notifySuccess" fieldName="showOtpAsDot" :isLocked="settingStore.lockedPreferences.includes('showOtpAsDot')" label="field.show_otp_as_dot" help="field.show_otp_as_dot.help" />
                        <!-- reveal dotted OTPs -->
                        <FormCheckbox v-model="preferenceStore.revealDottedOTP" @update:model-value="notifySuccess" fieldName="revealDottedOTP" :isLocked="settingStore.lockedPreferences.includes('revealDottedOTP')" :isDisabled="!preferenceStore.showOtpAsDot" label="field.reveal_dotted_otp" help="field.reveal_dotted_otp.help" :isIndented="true" />
                    <!-- show next OTP -->
                    <FormCheckbox v-if="settingStore.hasFeature_showNextOtp" v-model="preferenceStore.showNextOtp" @update:model-value="notifySuccess" fieldName="showNextOtp" :isLocked="settingStore.lockedPreferences.includes('showNextOtp')" label="field.show_next_otp" help="field.show_next_otp.help" />
                </div>
            </form>
        </div>
        <VueFooter :showButtons="true">
            <NavigationButton action="close" @closed="router.push({ name: 'accounts' })" />
        </VueFooter>
    </div>
</template>