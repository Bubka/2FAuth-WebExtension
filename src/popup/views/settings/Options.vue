<script setup>
    import { useI18n } from 'vue-i18n'
    import { sendMessage } from 'webext-bridge/popup'
    import { usePreferenceStore } from '@/stores/preferenceStore'
    import { useGroups } from '@popup/stores/groups'
    import { useNotifyStore } from '@popup/stores/notify'
    import { openUrlInNewTab } from '@popup/composables/helpers'
    import { LucideExternalLink } from 'lucide-vue-next'
    import SettingTabs from '@popup/layouts/SettingTabs.vue'
    import FormCheckbox from '@popup/components/formElements/FormCheckbox.vue'
    import FormToggle from '@popup/components/formElements/FormToggle.vue'
    import FormSelect from '@popup/components/formElements/FormSelect.vue'

    const groups = useGroups()
    const notify = useNotifyStore()
    const preferenceStore = usePreferenceStore()
    const { t } = useI18n({ useScope: "global" })
    const kickAfter = ref(preferenceStore.kickUserAfter)

    const themes = [
        { text: 'message.light', value: 'light', icon: 'Sun' },
        { text: 'message.dark', value: 'dark', icon: 'Moon' },
        { text: 'message.automatic', value: 'system', icon: 'MonitorCheck' },
    ]
    const passwordFormats = [
        { text: 'message.pair_label', value: 2, legend: 'message.pair', title: 'message.pair_legend' },
        { text: 'message.trio_label', value: 3, legend: 'message.trio', title: 'message.trio_legend' },
        { text: 'message.half_label', value: 0.5, legend: 'message.half', title: 'message.half_legend' },
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
        { text: 'message.otp_generation_on_request', value: true, legend: 'message.otp_generation_on_request_legend', title: 'message.otp_generation_on_request_title' },
        { text: 'message.otp_generation_on_home', value: false, legend: 'message.otp_generation_on_home_legend', title: 'message.otp_generation_on_home_title' },
    ]

    const langs = computed(() => {
        let locales = [{
            text: 'lang.browser_preference',
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
    })

    /**
     * Saves a preference
     * @param {string} preference 
     * @param {any} value 
     */
    function savePreference(preference, value) {
        preferenceStore[preference] = value
    }

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
        console.log('lang', lang)
        
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

</script>

<template>
    <div>
        <SettingTabs activeTab="settings.options" />
        <div class="options-tabs">
            <form>
                <!-- user preferences -->
                <div class="block">
                    <h4 class="title is-4 has-text-grey-light">{{ $t('message.general') }}</h4>
                    <!-- Language -->
                    <FormSelect v-model="preferenceStore.lang" @update:model-value="val => applyLanguage(val)" :options="langs" fieldName="lang" label="field.language.label" help="field.language.help" />
                    <div class="field help">
                        {{ $t('message.some_translation_are_missing') }}
                        <a class="ml-2" @click="openUrlInNewTab('https://crowdin.com/project/2fauth')">
                            <span class="icon-text" style="line-height: inherit">
                                <span>{{ $t('message.help_translate_2fauth') }}</span>
                                <span class="icon is-small"><LucideExternalLink /></span>
                            </span>
                        </a>
                    </div>
                    <!-- theme -->
                    <FormToggle v-model="preferenceStore.theme" @update:model-value="applyTheme()" :choices="themes" fieldName="theme" label="field.theme.label" help="field.theme.help"/>
                    <!-- show icon -->
                    <FormCheckbox v-model="preferenceStore.showAccountsIcons" @update:model-value="notifySuccess" fieldName="showAccountsIcons" label="field.show_accounts_icons.label" help="field.show_accounts_icons.help" />
                    <!-- password format -->
                    <FormCheckbox v-model="preferenceStore.formatPassword" @update:model-value="notifySuccess" fieldName="formatPassword" label="field.password_format.label" help="field.password_format.help" />
                    <FormToggle v-model="preferenceStore.formatPasswordBy" @update:model-value="notifySuccess" :choices="passwordFormats" fieldName="formatPasswordBy" :isDisabled="!preferenceStore.formatPassword" />
                    <!-- clear search on copy -->
                    <FormCheckbox v-model="preferenceStore.clearSearchOnCopy" @update:model-value="notifySuccess" fieldName="clearSearchOnCopy" label="field.clear_search_on_copy.label" help="field.clear_search_on_copy.help" />
                    
                    <h4 class="title is-4 pt-4 has-text-grey-light">{{ $t('message.groups') }}</h4>
                    <!-- default group -->
                    <FormSelect v-model="preferenceStore.defaultGroup" @update:model-value="notifySuccess" :options="groupsList" fieldName="defaultGroup" label="field.default_group.label" help="field.default_group.help" />
                    <!-- retain active group -->
                    <FormCheckbox v-model="preferenceStore.rememberActiveGroup" @update:model-value="notifySuccess" fieldName="rememberActiveGroup" label="field.remember_active_group.label" help="field.remember_active_group.help" />
                    <!-- always return to default group after copying -->
                    <FormCheckbox v-model="preferenceStore.viewDefaultGroupOnCopy" @update:model-value="notifySuccess" fieldName="viewDefaultGroupOnCopy" label="field.view_default_group_on_copy.label" help="field.view_default_group_on_copy.help" />
                    
                    <h4 class="title is-4 pt-4 has-text-grey-light">{{ $t('message.security') }}</h4>
                    <!-- auto lock -->
                    <FormSelect v-model="kickAfter" @update:model-value="changeAutolockDelay()" :options="kickUserAfters" fieldName="kickUserAfter" label="field.auto_lock.label" help="field.auto_lock.help" />
                    <!-- get OTP on request -->
                    <FormToggle v-model="preferenceStore.getOtpOnRequest" @update:model-value="notifySuccess" :choices="getOtpTriggers" fieldName="getOtpOnRequest" label="field.otp_generation.label" help="field.otp_generation.help"/>
                        <!-- close otp on copy -->
                        <FormCheckbox v-model="preferenceStore.closeOtpOnCopy" @update:model-value="notifySuccess" fieldName="closeOtpOnCopy" label="field.close_otp_on_copy.label" help="field.close_otp_on_copy.help" :isDisabled="!preferenceStore.getOtpOnRequest" :isIndented="true" />
                        <!-- auto-close timeout -->
                        <FormSelect v-model="preferenceStore.autoCloseTimeout" @update:model-value="notifySuccess" :options="autoCloseTimeout" fieldName="autoCloseTimeout" label="field.auto_close_timeout.label" help="field.auto_close_timeout.help"  :isDisabled="!preferenceStore.getOtpOnRequest" :isIndented="true" />
                        <!-- clear search on copy -->
                        <FormCheckbox v-model="preferenceStore.copyOtpOnDisplay" @update:model-value="notifySuccess" fieldName="copyOtpOnDisplay" label="field.copy_otp_on_display.label" help="field.copy_otp_on_display.help" :isDisabled="!preferenceStore.getOtpOnRequest" :isIndented="true" />
                    <!-- otp as dot -->
                    <FormCheckbox v-model="preferenceStore.showOtpAsDot" @update:model-value="notifySuccess" fieldName="showOtpAsDot" label="field.show_otp_as_dot.label" help="field.show_otp_as_dot.help" />
                        <!-- reveal dotted OTPs -->
                        <FormCheckbox v-model="preferenceStore.revealDottedOTP" @update:model-value="notifySuccess" fieldName="revealDottedOTP" label="field.reveal_dotted_otp.label" help="field.reveal_dotted_otp.help" :isDisabled="!preferenceStore.showOtpAsDot" :isIndented="true" />                                            
                </div>
            </form>
        </div>
        <VueFooter :showButtons="true">
            <ButtonBackCloseCancel :returnTo="{ name: 'accounts' }" action="close" />
        </VueFooter>
    </div>
</template>