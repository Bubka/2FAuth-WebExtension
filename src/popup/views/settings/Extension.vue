<script setup>
    import { useI18n } from 'vue-i18n'
    import { useSettingStore } from '@/stores/settingStore'
    import { useNotifyStore } from '@popup/stores/notify'
    import { sendMessage } from 'webext-bridge/popup'
    import SettingTabs from '@popup/layouts/SettingTabs.vue'
    import { useResetExtension } from '@popup/composables/helpers'

    const { t } = useI18n({ useScope: "global" })
    const settingStore = useSettingStore()
    const notify = useNotifyStore()

    const hostUrl = ref(settingStore.hostUrl)
    const apiToken = ref(null)
    const extPassword = ref('')
    const isReseting = ref(false)
    const errors = ref('')
    const isRunning = ref(false)

    function changePassword() {

    }

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

    function resetExtension() {
        if(confirm(t('message.are_you_sure'))) {
            useResetExtension()
        }
    }

    onMounted(async () => {
        getPartialToken()
    })
</script>

<template>
    <div>
        <SettingTabs activeTab="settings.extension" />
        <div class="options-tabs">
            <form>
                <FormField v-model="hostUrl" fieldName="hostUrl" :isDisabled="true" inputType="text" label="field.hostUrl.label" />
                <FormField v-model="apiToken" fieldName="apiToken" :isDisabled="true"  inputType="text" label="field.apiToken.label" />
                <FormPasswordField v-model="extPassword" fieldName="extPassword" :fieldError="errors" :showRules="true" label="field.extPassword.label"  help="field.extPassword.help" autocomplete="new-password" />
                <div class="field is-grouped">
                    <div class="control">
                        <VueButton :isLoading="isRunning" class="button mr-2" nativeType="button" @click="changePassword">
                            {{  $t('message.change_password') }}
                        </VueButton>
                        <!-- <span v-if="isConnected == true" class="has-text-success-dark">{{ $t('message.hi_x_its_all_good', { username: username }) }} <FontAwesomeIcon :icon="['fas', 'check']" size="xs" /></span>
                        <span v-else-if="isConnected == false" class="has-text-danger">Nop <FontAwesomeIcon :icon="['fas', 'times']" size="xs" /></span> -->
                    </div>
                </div>
            </form>
            <!-- danger zone -->
            <form>
                <h4 class="title is-4 pt-6 has-text-danger">{{ $t('message.danger_zone') }}</h4>
                <div class="is-left-bordered-danger">
                    <div class="block is-size-6 is-size-7-mobile">
                        {{  $t('message.reset_extension_description') }}
                        <span class="is-block has-text-grey has-text-weight-bold">
                            {{  $t('message.token_remains_valid') }}
                        </span>
                    </div>
                    <VueButton @click="resetExtension" :isLoading="isReseting" id="btnResetExtension" color="is-danger">
                        {{ $t('message.reset_extension') }}
                    </VueButton>
                </div>
            </form>
        </div>
        <VueFooter :showButtons="true">
            <ButtonBackCloseCancel :returnTo="{ name: 'accounts' }" action="close" />
        </VueFooter>
    </div>
</template>