<script setup>
    import { useExtensionStore } from '@/stores/extensionStore'
    import { useNotifyStore } from '@popup/stores/notify'
    import SettingTabs from '@popup/layouts/SettingTabs.vue'
    import userService from '@popup/services/userService'
    import FormButtons from '@popup/components/formElements/FormButtons.vue'

    const extensionStore = useExtensionStore()
    const router = useRouter()
    const notify = useNotifyStore()

    const _hostUrl = ref(extensionStore.hostUrl)
    const _apiToken = ref(extensionStore.apiTokenPartial)
    const _extPassword = ref(extensionStore.extPassword)

    const errors = ref('')
    const isRunning = ref(false)

    function changePassword() {

    }
</script>

<template>
    <div>
        <SettingTabs activeTab="settings.extension" />
        <div class="options-tabs">
            <form>
                <FormField v-model="_hostUrl" fieldName="hostUrl" :isDisabled="true" inputType="text" label="field.hostUrl.label" />
                <FormField v-model="_apiToken" fieldName="apiToken" :isDisabled="true"  inputType="text" label="field.apiToken.label" />
                <FormPasswordField v-model="_extPassword" fieldName="extPassword" :fieldError="errors" :showRules="true" label="field.extPassword.label"  help="field.extPassword.help" autocomplete="new-password" />            <div class="field is-grouped">
                <div class="control">
                    <VueButton :isLoading="isRunning" class="button mr-2" nativeType="button" @click="changePassword">
                        {{  $t('message.change_password') }}
                    </VueButton>
                    <!-- <span v-if="isConnected == true" class="has-text-success-dark">{{ $t('message.hi_x_its_all_good', { username: username }) }} <FontAwesomeIcon :icon="['fas', 'check']" size="xs" /></span>
                    <span v-else-if="isConnected == false" class="has-text-danger">Nop <FontAwesomeIcon :icon="['fas', 'times']" size="xs" /></span> -->
                </div>
            </div>
            </form>
        </div>
        <VueFooter :showButtons="true">
            <ButtonBackCloseCancel :returnTo="{ name: 'accounts' }" action="close" />
        </VueFooter>
    </div>
</template>