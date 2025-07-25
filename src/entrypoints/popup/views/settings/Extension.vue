<script setup>
    import { useSettingStore } from '@/stores/settingStore'
    import { useNotify, TabBar } from '@2fauth/ui'
    import { useResetExtension } from '@popup/composables/resetter'
    import { isFilled } from '@popup/composables/validators'
    import tabs from './tabs'

    const { t } = useI18n()
    const router = useRouter()
    const settingStore = useSettingStore()
    const notify = useNotify()

    const hostUrl = ref(settingStore.hostUrl)
    const apiToken = ref(null)
    const extNewPassword = ref('')
    const extCurrentPassword = ref('')
    const isReseting = ref(false)
    const errors = ref({
        currentPassword: '',
        newPassword: ''
    })
    const isRunning = ref(false)

    /**
     * 
     */
    async function changePassword() {
        const hasValidCurrentPassword = validateCurrentPassword()
        const hasValidNewPassword = validateNewPassword()
        notify.clear()

        if (hasValidCurrentPassword && hasValidNewPassword) {
            const { status: checkPasswordStatus } = await sendMessage('CHECK_ENC_KEY', { password: extCurrentPassword.value }, 'background')

            if (! checkPasswordStatus) {
                notify.alert({ text: t('error.wrong_current_password') })
                return
            }

            const { status: changePasswordStatus, reason } = await sendMessage('CHANGE_ENC_KEY', { password: extNewPassword.value }, 'background')

            if (! changePasswordStatus) {
                notify.alert({ text: t(reason) })
                return
            }

            notify.success({ type: 'is-success', text: t('message.password_changed') })
        }
    }

    /**
     * 
     */
    async function getPartialToken() {
        sendMessage('GET_PARTIAL_PAT', { }, 'background').then((response) => {
            if (response.status) {
                apiToken.value = response.partialPat
            }
            else {
                notify.alert({ text: t('error.failed_to_get_token')})
            }
        })
    }

    /**
     * 
     */
    function resetExtension() {
        if(confirm(t('message.are_you_sure'))) {
            useResetExtension()
        }
    }

    /**
     * 
     */
    function validateNewPassword() {
        errors.value.newPassword = ''

        if (! isFilled(extNewPassword.value)) {
            errors.value.newPassword = t('message.field_is_required')
            return false
        }

        return true
    }

    /**
     * 
     */
    function validateCurrentPassword() {
        errors.value.currentPassword = ''

        if (! isFilled(extCurrentPassword.value)) {
            errors.value.currentPassword = t('message.field_is_required')
            return false
        }

        return true
    }

    onMounted(async () => {
        getPartialToken()
    })

    onBeforeRouteLeave((to) => {
        if (! to.name.startsWith('settings.')) {
            notify.clear()
        }
    })
    
</script>

<template>
    <div>
        <TabBar :tabs="tabs" :active-tab="'settings.extension'" :is-responsive="false" @tab-selected="(to) => router.push({ name: to })" />
        <div class="options-tabs">
            <form>
                <FormField v-model="hostUrl" fieldName="hostUrl" :isDisabled="true" inputType="text" label="field.hostUrl" />
                <FormField v-model="apiToken" fieldName="apiToken" :isDisabled="true"  inputType="text" label="field.apiToken" />
                <h4 class="title is-4 pt-6 has-text-grey-light">{{ $t('message.change_password') }}</h4>
                <FormPasswordField v-model="extCurrentPassword" fieldName="extCurrentPassword" :errorMessage="errors.currentPassword" inputType="password" label="field.extCurrentPassword" autocomplete="none" help="field.extCurrentPassword.help" />
                <FormPasswordField v-model="extNewPassword" fieldName="extNewPassword" :errorMessage="errors.newPassword" :showRules="true" label="field.extNewPassword"  help="field.extNewPassword.help" autocomplete="new-password" />
                <div class="field is-grouped">
                    <div class="control">
                        <VueButton :isLoading="isRunning" class="button mr-2" nativeType="button" @click="changePassword">
                            {{  $t('message.save') }}
                        </VueButton>
                    </div>
                </div>
            </form>
            <!-- danger zone -->
            <form>
                <h4 class="title is-4 pt-6 has-text-danger">{{ $t('message.danger_zone') }}</h4>
                <div class="is-left-bordered-danger">
                    <h5 class="title is-5 has-text-grey-light mb-2">{{ $t('message.reset_extension') }}</h5>
                    <div class="block is-size-6 is-size-7-mobile">
                        {{  $t('message.reset_extension_description') }}
                        <span class="is-block mt-2 has-text-grey has-text-weight-bold">
                            {{  $t('message.token_remains_valid') }}
                        </span>
                    </div>
                    <VueButton nativeType="submit" @click="resetExtension" :isLoading="isReseting" id="btnResetExtension" color="is-danger">
                        {{ $t('message.reset') }}
                    </VueButton>
                </div>
            </form>
        </div>
        <VueFooter>
            <NavigationButton action="close" @closed="router.push({ name: 'accounts' })" :current-page-title="$t('title.settings')" />
        </VueFooter>
    </div>
</template>