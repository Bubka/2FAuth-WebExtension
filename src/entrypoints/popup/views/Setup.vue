<script setup>
    import { useSettingStore } from '@/stores/settingStore'
    import { useNotifyStore }  from '@popup/stores/notify'
    import { usePreferenceStore } from '@/stores/preferenceStore'
    import { isFilled, isHttpUrl } from '@popup/composables/validators'
    import userService from '@popup/services/userService'
    import FormButtons from '@popup/components/formElements/FormButtons.vue'
    import { LucideCheck } from 'lucide-vue-next'
    
    const { t } = useI18n()
    const settingStore = useSettingStore()
    const preferenceStore = usePreferenceStore()
    const router = useRouter()
    const notify = useNotifyStore()

    const _hostUrl = ref('')
    const _apiToken = ref('')
    const _extPassword = ref(null)

    const errors = ref({
        hostUrl: '',
        apiToken: '',
        extPassword: '',
        connexion: '',
    })
    const isTesting = ref(false)
    const isSaving = ref(false)
    const isConnected = ref(null)
    const username = ref(null)

    /**
     * Get user based on provided token
     */
     function checkConnection() {
        errors.value.connexion = ''
        const hasValidHostUrl = validateHostUrl()
        const hasValidApiToken = validateApiToken()

        if (hasValidHostUrl && hasValidApiToken) {
            isTesting.value = true
            isConnected.value = null
            username.value = null

            userService.get({
                baseURL: _hostUrl.value + '/api/v1',
                headers: { 'Authorization': 'Bearer ' + _apiToken.value , 'X-Requested-With': 'XMLHttpRequest', 'Content-Type': 'application/json' },
                returnError: true,
                ignoreRequestInterceptor: true,
            }).then(response => {
                username.value = response.data.name
                isConnected.value = true
            })
            .catch((error) => {
                isConnected.value = false
                if (error.hasOwnProperty('status') && error.status == 401) {
                    errors.value.connexion = t('error.failed_to_authenticate_with_host')
                }
                else {
                    errors.value.connexion = t('error.failed_to_contact_host')
                }
            })
            .finally(() => {
                isTesting.value = false
            })
        }
    }

    /**
     * Save setting to webext storage
     */
    function saveSetup() {
        notify.clear()
        isConnected.value = null
        const hasValidHostUrl = validateHostUrl()
        const hasValidApiToken = validateApiToken()
        const hasValidPassword = validatePassword()

        if (hasValidHostUrl && hasValidApiToken && hasValidPassword) {
            isSaving.value = true

            userService.getPreferences({
                baseURL: _hostUrl.value + '/api/v1',
                headers: { 'Authorization': 'Bearer ' + _apiToken.value , 'X-Requested-With': 'XMLHttpRequest', 'Content-Type': 'application/json' },
                returnError: true,
                ignoreRequestInterceptor: true,
            }).then(async ({ data: fetchedPreferences }) => {
                // Setting enc key
                const { status: setEncKeyStatus } = await sendMessage('SET_ENC_KEY', { password: _extPassword.value }, 'background')

                if (! setEncKeyStatus) {
                    notify.alert({ text: t('error.encryption_key_generation_failed') })
                    return
                }

                // Encrypt the PAT
                const { status: tokenEncryptionStatus, reason: failedEncReason } = await sendMessage('ENCRYPT_PAT', { apiToken: _apiToken.value }, 'background')

                if (! tokenEncryptionStatus) {
                    notify.alert({ text: t(failedEncReason) })
                    sendMessage('RESET_EXT', { }, 'background')
                    return
                }

                const { status: isUnlocked, reason: failedUnlockReason } = await sendMessage('UNLOCK', { }, 'background')

                if (isUnlocked) {
                    // User preferences
                    await preferenceStore.$persistedState.isReady()
                    preferenceStore.updateWith(fetchedPreferences, false)

                    // Store settings
                    // This must be the last thing done when everything is OK because
                    // the mustBeConfigured middleware checks it every time navigation occurs
                    settingStore.$patch({
                        hostUrl: _hostUrl.value,
                    })

                    router.push({ name: 'accounts' })
                }
                else {
                    notify.alert({ text: t(failedUnlockReason) })
                    sendMessage('RESET_EXT', { }, 'background')
                }
            })
            .catch(error => {
                if (error.code == 'ERR_NETWORK') {
                    notify.alert({ text: t('error.failed_to_contact_host') })
                }
                else if (error.hasOwnProperty('status') && error.status == 401) {
                    notify.alert({ text: t('error.failed_to_authenticate_with_host') })
                }
                else {
                    notify.error(error)
                }
            })
            .finally(() => {
                isSaving.value = false
            })
        }
    }

    function validateHostUrl() {
        errors.value.hostUrl = ''

        if (! isFilled(_hostUrl.value) || ! isHttpUrl(_hostUrl.value)) {
            errors.value.hostUrl = t('message.field_is_required_and_valid_url')
            return false
        }

        return true
        // return errors.value.values().some(val => val.length > 0);
    }

    function validateApiToken() {
        errors.value.apiToken = ''

        if (! isFilled(_apiToken.value)) {
            errors.value.apiToken = t('message.field_is_required')
            return false
        }

        return true
    }

    function validatePassword() {
        errors.value.extPassword = ''

        if (! isFilled(_extPassword.value)) {
            errors.value.extPassword = t('message.field_is_required')
            return false
        }

        return true
    }

</script>

<template>
    <div>
        <h1 class="title has-text-grey-dark" v-html="$t('title.popup.setup')"></h1>
        <form id="frmExtSetup" @submit.prevent="saveSetup">
            <FormField v-model="_hostUrl" fieldName="hostUrl" :fieldError="errors.hostUrl" inputType="text" label="field.hostUrl.label" help="field.hostUrl.help" />
            <FormTextarea v-model="_apiToken" :fieldError="errors.apiToken" fieldName="apiToken" rows="4" label="field.apiToken.label"  help="field.apiToken.help" :size="'is-small'" />
            <div class="field is-grouped">
                <div class="control">
                    <VueButton :isLoading="isTesting" class="tag mr-2" nativeType="button" @click="checkConnection">
                        {{  $t('message.test') }}
                    </VueButton>
                    <!-- <span v-if="isConnected == true" class="has-text-success-dark is-size-7">{{ $t('message.hi_x_its_all_good', { username: username }) }}
                         <LucideUserRoundCheck />
                    </span> -->
                    <span v-if="isConnected == true" class="icon-text has-text-success-dark is-size-7">
                        <span>{{ $t('message.hi_x_its_all_good', { username: username }) }}</span>
                        <span class="icon"><LucideCheck class="icon-size-1"/></span>
                    </span>
                    <span v-else-if="isConnected == false" class="has-text-danger is-size-7">{{  errors.connexion }}</span>
                </div>
            </div>
            <FormPasswordField v-model="_extPassword" fieldName="extPassword" :fieldError="errors.extPassword" :showRules="true" label="field.extPassword.label"  help="field.extPassword.help" autocomplete="new-password" />
            <VueFooter :showButtons="true">
                <FormButtons
                    :submitId="'btnSubmitSetup'"
                    :isBusy="isSaving == true"
                    :caption="'message.save'"
                    :showCancelButton="true"
                    cancelLandingView="landing" />
            </VueFooter>
        </form>
    </div>
</template>
