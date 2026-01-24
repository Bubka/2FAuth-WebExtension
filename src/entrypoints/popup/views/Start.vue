<script setup>
    import qrcodeService from '@popup/services/qrcodeService'
    import { useBusStore } from '@popup/stores/bus'
    import { useNotify } from '@2fauth/ui'
    import { useTwofaccounts } from '@popup/stores/twofaccounts'

    const router = useRouter()
    const bus = useBusStore()
    const notify = useNotify()
    const twofaccounts = useTwofaccounts()    

    /**
     * Upload the submitted QR code file to the backend for decoding, then route the user
     * to the Create or Import form with decoded URI to prefill the form
     */
    async function submitQrCode() {

        // Get the QR image data from background
        const result = await sendMessage('GET_QR_BLOB', {}, 'background')
        
        if (! result.success) {
            notify.alert({ text: t('error.qr_capture_failed') })
        }
        
        // Reconstruct blob from ArrayBuffer
        const imageBuffer = new Uint8Array(result.imageBuffer)
        const blob = new Blob([imageBuffer], { type: result.mimeType })
        
        // Decode the QR code by uploading to backend
        const decodeResponse = await qrcodeService.decode(blob)

        if (! decodeResponse.success) {
            notify.alert({ text: error.response.data.message })
            return
        }

        bus.decodedUri = decodeResponse.data
        console.log(bus.decodedUri)

        // router.push({ name: 'createAccount' })
    }

    /**
     * Handle QR capture button click
     */
    async function handleCaptureQr() {
        try {
            const result = await sendMessage('INJECT_CONTENT_SCRIPT', {}, 'background')
            if (!result.success) {
                notify.alert({ text: t('error.failed_to_inject_content_script') })
            }
            // Popup stays open, waiting for user to click a QR code
        } catch (error) {
            notify.alert({ text: t('error.failed_to_inject_content_script') })
            console.error('Error injecting content script:', error)
        }
    }

    onMounted(async () => {
        // Check if there's QR data waiting from a capture
        try {
            const qrBlobData = await sendMessage('GET_QR_BLOB', {}, 'background')
            
            if (qrBlobData.success && qrBlobData.imageBuffer) {
                // QR data found, navigate to create route
                router.push({ name: 'createAccount' })
            }
        } catch (error) {
            // Ignore - no QR data available
        }
    })

</script>

<template>
    <!-- static landing UI -->
    <div class="container has-text-centered">
        <div class="columns quick-uploader">
            <!-- trailer phrase that invite to add an account -->
            <div class="column is-full quick-uploader-header" :class="{ 'is-invisible' : twofaccounts.count !== 0 }">
                {{ $t('message.no_account_here') }}<br>
                {{ $t('message.add_first_account') }}
            </div>
            <!-- Livescan button -->
            <div class="column is-full quick-uploader-button" >
                <div class="quick-uploader-centerer">
                    <!-- scan button that launch qrcode detection in current tab -->
                    <button type="button" class="button is-link is-medium is-rounded is-main" @click="handleCaptureQr()">
                        {{ $t('label.scan_qrcode') }}
                    </button>
                </div>
            </div>
            <!-- alternative methods -->
            <div class="column is-full">
                <div class="block light-or-darker">{{ $t('message.alternative_methods') }}</div>
                <!-- link to advanced form -->
                <div class="block has-text-link">
                    <RouterLink class="button is-link is-outlined is-rounded" :to="{ name: 'createAccount' }" >
                        {{ $t('link.use_advanced_form') }}
                    </RouterLink>
                </div>
            </div>
        </div>
        <!-- Footer -->
        <VueFooter >
            <template #default>
                <NavigationButton v-if="!twofaccounts.isEmpty" action="back" @goback="router.push({ name: 'accounts' })" :previous-page-title="$t('title.accounts')" />
            </template>
        </VueFooter>
    </div>
</template>
