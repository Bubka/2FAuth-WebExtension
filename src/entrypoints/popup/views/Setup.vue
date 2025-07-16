<script setup>
    import { useSettingStore } from '@/stores/settingStore'
    import { useNotify } from '@2fauth/ui'
    import { useErrorHandler } from '@2fauth/stores'
    import { usePreferenceStore } from '@/stores/preferenceStore'
    import { isFilled, isHttpUrl } from '@popup/composables/validators'
    import userService from '@popup/services/userService'
    import { FormButtons } from '@2fauth/formcontrols'
    import { LucideCheck } from 'lucide-vue-next'
    
    const { t } = useI18n()
    const settingStore = useSettingStore()
    const preferenceStore = usePreferenceStore()
    const router = useRouter()
    const notify = useNotify()

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
                    useErrorHandler().show(error)
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
            errors.value.hostUrl = t('error.field_is_required_and_valid_url')
            return false
        }

        return true
        // return errors.value.values().some(val => val.length > 0);
    }

    function validateApiToken() {
        errors.value.apiToken = ''

        if (! isFilled(_apiToken.value)) {
            errors.value.apiToken = t('error.field_is_required')
            return false
        }

        return true
    }

    function validatePassword() {
        errors.value.extPassword = ''

        if (! isFilled(_extPassword.value)) {
            errors.value.extPassword = t('error.field_is_required')
            return false
        }

        return true
    }

</script>

<template>
    <div>
        <h1 class="title has-text-grey-dark" v-html="$t('heading.setup')"></h1>
        <form id="frmExtSetup" @submit.prevent="saveSetup">
            <FormField v-model="_hostUrl" fieldName="hostUrl" :errorMessage="errors.hostUrl" inputType="text" label="field.hostUrl" help="field.hostUrl.help" />
            <FormTextarea v-model="_apiToken" :errorMessage="errors.apiToken" fieldName="apiToken" rows="4" label="field.apiToken"  help="field.apiToken.help" :size="'is-small'" />
            <div class="field is-grouped">
                <div class="control">
                    <VueButton :isLoading="isTesting" class="tag mr-2" nativeType="button" @click="checkConnection">
                        {{  $t('label.test') }}
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
            <FormPasswordField v-model="_extPassword" fieldName="extPassword" :errorMessage="errors.extPassword" :showRules="true" label="field.extPassword"  help="field.extPassword.help" autocomplete="new-password" />
            <VueFooter>
                <FormButtons
                    submitId="btnSubmitSetup"
                    submitLabel="message.save"
                    :isBusy="isSaving == true"
                    :showCancelButton="true"
                    @cancel="router.push({ name: 'landing' })" />
            </VueFooter>
        </form>
    </div>
</template>
