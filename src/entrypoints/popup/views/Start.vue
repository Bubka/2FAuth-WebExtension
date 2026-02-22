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
    <StackLayout :should-grow="false">
        <template #content>
            <div class="has-text-centered">
                <!-- trailer phrase that invite to add an account -->
                <div class="mt-5" :class="{ 'is-hidden' : twofaccounts.count !== 0 }">
                    {{  $t('message.need_to_import_qrcode_punchline') }}<br>
                    {{  $t('message.detect_qrcode_in_page_legend') }}
                </div>
                <!-- Livescan button -->
                <div class="quick-uploader-wrapper p-0 mt-6 mb-5" >
                    <div class="quick-uploader-background"></div>
                    <div class="quick-uploader-button is-align-content-center">
                        <!-- scan button that launch qrcode detection in current tab -->
                        <button type="button" class="button is-link is-medium is-rounded is-main" @click="scanForQrCodeInTab()">
                            {{ $t('label.detect_qrcode') }}
                        </button>
                    </div>
                    <!-- <FormFieldError v-if="form.errors.hasAny('qrcode')" :error="form.errors.get('qrcode')" :field="'qrcode'" /> -->
                </div>
            </div>
        </template>
        <template #footer>
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
        </template>
    </StackLayout>
</template>
