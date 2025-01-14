<script setup>
    import { useI18n } from 'vue-i18n'
    import { storeToRefs } from 'pinia'
    import { useSettingStore } from '@/stores/settingStore'
    import { useNotifyStore }  from '@popup/stores/notify'
    import { useBusStore }     from '@popup/stores/busStore'

    import { sendMessage } from 'webext-bridge/popup'
    import userService from '@popup/services/userService'
    import FormButtons from '@popup/components/formElements/FormButtons.vue'
    
    const { t } = useI18n({ useScope: "global" })
    const settingStore = useSettingStore()
    const busStore = useBusStore()
    const router = useRouter()
    const notify = useNotifyStore()
    const { hostUrl } = storeToRefs(settingStore)

    const _hostUrl = ref('')
    const _apiToken = ref('')
    const _extPassword = ref(null)

    const errors = ref('')
    const isTesting = ref(false)
    const isSaving = ref(false)
    const isConnected = ref(null)
    const username = ref(null)

    /**
     * Get user based on provided token
     */
     function checkConnection() {
        isTesting.value = true
        isConnected.value = null
        username.value = null

        userService.get({
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
            .catch(error => {
                isConnected.value = false
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
        isSaving.value = true

        userService.get({
            baseURL: _hostUrl.value + '/api/v1',
            headers: { 'Authorization': 'Bearer ' + _apiToken.value , 'X-Requested-With': 'XMLHttpRequest', 'Content-Type': 'application/json' },
            returnError: true,
            ignoreRequestInterceptor: true,
        }).then(async () => {
            const { status: setEncKeyStatus } = await sendMessage('SET_ENC_KEY', { password: _extPassword.value }, 'background')

            if (! setEncKeyStatus) {
                notify.alert({ text: t('error.encryption_key_generation_failed') })
                return
            }

            const { status: tokenEncryptionStatus, reason: failedEncReason } = await sendMessage('ENCRYPT_PAT', { apiToken: _apiToken.value }, 'background')

            isSaving.value = true

            userService.get({
                baseURL: _hostUrl.value + '/api/v1',
                headers: { 'Authorization': 'Bearer ' + _apiToken.value , 'X-Requested-With': 'XMLHttpRequest', 'Content-Type': 'application/json' },
                returnError: true,
                ignoreRequestInterceptor: true,
            }).then(async () => {
                const { status: setEncKeyStatus } = await sendMessage('SET_ENC_KEY', { password: _extPassword.value }, 'background')

                if (! setEncKeyStatus) {
                    notify.alert({ text: t('error.encryption_key_generation_failed') })
                    return
                }

                const { status: tokenEncryptionStatus, reason: failedEncReason } = await sendMessage('ENCRYPT_PAT', { apiToken: _apiToken.value }, 'background')

                if (! tokenEncryptionStatus) {
                    notify.alert({ text: t(failedEncReason) })
                    return
                }

                settingStore.$patch({
                    hostUrl: _hostUrl.value,
                })

                const { status: unlockingStatus, reason: failedUnlockReason } = await sendMessage('UNLOCK', { }, 'background')

                if (unlockingStatus) {
                    router.push({ name: 'accounts' })
                }
                else {
                    notify.alert({ text: t(failedUnlockReason) })
                }               
            })
            .catch(error => {
                notify.error(error)
            })
            .finally(() => {
                isSaving.value = false
            })
        }

            const { status: unlockingStatus, reason: failedUnlockReason } = await sendMessage('UNLOCK', { }, 'background')

            if (unlockingStatus) {
                router.push({ name: 'accounts' })
            }
            else {
                notify.alert({ text: t(failedUnlockReason) })
            }               
        })
        .catch(error => {
            notify.error(error)
        })
        .finally(() => {
            isSaving.value = false
        })
    }

</script>

<template>
    <div>
        <h1 class="title has-text-grey-dark" v-html="$t('title.popup.setup')"></h1>
        <form id="frmExtSetup" @submit.prevent="saveSetup">
            <FormField v-model="_hostUrl" fieldName="hostUrl" :fieldError="errors" inputType="text" label="field.hostUrl.label" help="field.hostUrl.help" />
            <FormTextarea v-model="_apiToken" :fieldError="errors" fieldName="apiToken" rows="4" label="field.apiToken.label"  help="field.apiToken.help" :size="'is-small'" />
            <div class="field is-grouped">
                <div class="control">
                    <VueButton :isLoading="isTesting" class="tag mr-2" nativeType="button" @click="checkConnection">
                        {{  $t('message.test') }}
                    </VueButton>
                    <span v-if="isConnected == true" class="has-text-success-dark">{{ $t('message.hi_x_its_all_good', { username: username }) }} <FontAwesomeIcon :icon="['fas', 'check']" size="xs" /></span>
                    <span v-else-if="isConnected == false" class="has-text-danger">Nop <FontAwesomeIcon :icon="['fas', 'times']" size="xs" /></span>
                </div>
            </div>
            <FormPasswordField v-model="_extPassword" fieldName="extPassword" :fieldError="errors" :showRules="true" label="field.extPassword.label"  help="field.extPassword.help" autocomplete="new-password" />
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
