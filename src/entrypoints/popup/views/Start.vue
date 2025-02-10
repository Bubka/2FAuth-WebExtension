<script setup>
    import { openUrlInNewTab } from '@popup/composables/helpers'
    import { useSettingStore } from '@/stores/settingStore'
    // import Form from '@/components/formElements/Form'
    // import { useUserStore } from '@/stores/user'
    // import { useBusStore } from '@/stores/bus'
    // import { useNotifyStore } from '@/stores/notify'
    // import { useTwofaccounts } from '@/stores/twofaccounts'

    const settingStore = useSettingStore()
    // const router = useRouter()
    // const user = useUserStore()
    // const bus = useBusStore()
    // const notify = useNotifyStore()
    // const twofaccounts = useTwofaccounts()

    // const qrcodeInput = ref(null)
    // const qrcodeInputLabel = ref(null)
    // const form = reactive(new Form({
    //     qrcode: null,
    //     inputFormat: 'fileUpload',
    // }))
    
</script>

<template>
    <!-- static landing UI -->
    <div class="container has-text-centered">
        <div class="columns quick-uploader">
            <!-- trailer phrase -->
            <div class="column is-full quick-uploader-header">
                {{ $t('message.no_account_here') }}<br />
                {{ $t('message.registration_not_supported_visit_tour_instance') }}
            </div>
            <!-- Go to 2FAuth button -->
            <div class="column is-full quick-uploader-button" >
                <div class="quick-uploader-centerer">
                    <a :title="settingStore.hostUrl" tabindex="0" class="button is-link is-medium is-rounded is-main" @click="openUrlInNewTab(settingStore.hostUrl)">
                        {{ $t('message.go_to_2fauth_host') }}
                    </a>
                </div>
            </div>
        </div>
        <!-- Footer -->
        <VueFooter>
            <router-link id="lnkLanding" :to="{ name: 'settings.options' }" class="has-text-grey">
                {{ $t('link.settings') }}
            </router-link>
        </VueFooter>
    </div>
</template>
