<script setup>
    import { sendMessage } from 'webext-bridge/popup'
    import { useNotify } from '@2fauth/ui'
    import { useTwofaccounts } from '@popup/stores/twofaccounts'
    import { useSettingStore } from '@/stores/settingStore'
    import { openUrlInNewTab } from '@popup/composables/helpers'

    const { t } = useI18n()
    const notify = useNotify()
    const twofaccounts = useTwofaccounts()
    const settingStore = useSettingStore()

    /**
     * Handle QR capture button click
     */
    async function scanForQrCodeInTab() {
        try {
            const result = await sendMessage('INJECT_CONTENT_SCRIPT', {
                addButtonCaption: t('label.add_to_2fauth'),
                cancelButtonCaption: t('label.cancel')
            }, 'background')
            
            if (!result.success) {
                notify.alert({ text: t(result.error) })
            }
        } catch (error) {
            notify.alert({ text: t('error.failed_to_inject_content_script') })
        }
    }

</script>

<template>
    <!-- static landing UI -->
    <div class="container has-text-centered">
        <div class="columns quick-uploader">
            <!-- trailer phrase that invite to add an account -->
            <div class="column is-full py-5" :class="{ 'is-invisible' : twofaccounts.count !== 0 }">
                {{  $t('message.need_to_import_qrcode_punchline') }}<br>
                {{  $t('message.detect_qrcode_in_page_legend') }}
                <!-- {{ $t('message.add_first_account') }} -->
            </div>
            <!-- Livescan button -->
            <div class="column is-full quick-uploader-button mb-5" >
                <div class="quick-uploader-centerer">
                    <!-- scan button that launch qrcode detection in current tab -->
                    <button type="button" class="button is-link is-medium is-rounded is-main" @click="scanForQrCodeInTab()">
                        {{ $t('label.detect_qrcode') }}
                    </button>
                </div>
            </div>
            <!-- <div class="column pt-5">
                {{ $t('message.detect_qrcode_in_page_legend') }}
            </div> -->
        </div>
        <!-- Footer -->
        <VueFooter>
            <template #default>
                <a :title="settingStore.hostUrl" tabindex="0" class="button is-text is-rounded" @click="openUrlInNewTab(settingStore.hostUrl)">
                    {{ $t('link.go_to_2fauth_host') }}
                </a>
            </template>
            <template #subpart>
                <router-link id="lnkSettings" :to="{ name: 'settings.options' }" class="has-text-grey">
                    {{ $t('link.settings') }}
                </router-link>
            </template>
        </VueFooter>
    </div>
</template>
