<script setup>
    import { useI18n } from 'vue-i18n'
    import { sendMessage } from 'webext-bridge/popup'
    import { useNotifyStore } from '@popup/stores/notify'
    import FormButtons from '@popup/components/formElements/FormButtons.vue'
    import { useResetExtension } from '@popup/composables/resetter'
    
    const { t } = useI18n({ useScope: "global" })
    const notify = useNotifyStore()
    const router = useRouter()
    const isBusy = ref(false)
    const pwd = ref(null)
    const errors = ref(null)
    const isReseting = ref(false)

    function resetExtension() {
        if(confirm(t('message.are_you_sure'))) {
            useResetExtension()
        }
    }

</script>

<template>
    <div>
        <h1 class="title has-text-grey-dark" v-html="$t('title.popup.reset_extension')"></h1>
        <p class="block">{{ $t('message.reset_extension_description_bis') }}</p>
        <p class="block">{{ $t('message.reset_extension_description') }}</p>
        <p class="block">{{ $t('message.token_remains_valid') }}</p>
        <!-- danger zone -->
        <form>
            <!-- <h4 class="title is-4 has-text-danger">{{ $t('message.danger_zone') }}</h4> -->
            <!-- <div class="is-left-bordered-danger"> -->
                <!-- <div class="block">
                    <span class="is-block has-text-grey has-text-weight-bold">
                        {{  $t('message.token_remains_valid') }}
                    </span>
                </div> -->
                <VueButton @click="resetExtension" :isLoading="isReseting" id="btnResetExtension" color="is-danger">
                    {{ $t('message.reset_extension') }}
                </VueButton>
            <!-- </div> -->
        </form>
    </div>
    <VueFooter>
        <VueFooter :showButtons="true">
            <ButtonBackCloseCancel :returnTo="{ name: 'unlock' }" action="back" />
        </VueFooter>
    </VueFooter>
</template>
