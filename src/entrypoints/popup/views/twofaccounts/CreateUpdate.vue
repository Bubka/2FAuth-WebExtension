<script setup>
    import qrcodeService from '@popup/services/qrcodeService'
    import twofaccountService from '@popup/services/twofaccountService'
    import { useNotify, Spinner } from '@2fauth/ui'
    
    const { t } = useI18n()
    const router = useRouter()
    const notify = useNotify()
    
    const accountData = ref(null)
    const isLoading = ref(true)
    const errorMessage = ref(null)
    
    /**
     * Process the QR code image on component mount
     */
    onMounted(async () => {
        try {
            // Get the QR image data from background
            const result = await sendMessage('GET_QR_BLOB', {}, 'background')
            
            if (!result.success) {
                errorMessage.value = t('error.qr_capture_failed')
                notify.alert({ text: errorMessage.value })
                isLoading.value = false
                return
            }
            
            // Reconstruct blob from ArrayBuffer
            const imageBuffer = new Uint8Array(result.imageBuffer)
            const blob = new Blob([imageBuffer], { type: result.mimeType })
            
            // Decode the QR code
            const decodeResponse = await qrcodeService.decode(blob)
            const uri = decodeResponse.data
            
            // Preview the account
            const previewResponse = await twofaccountService.preview(uri)
            accountData.value = previewResponse.data
            
            isLoading.value = false
        } catch (error) {
            console.error('Error processing QR code:', error)
            errorMessage.value = t('error.qr_decode_failed')
            notify.alert({ text: errorMessage.value })
            isLoading.value = false
        }
    })
</script>

<template>
    <div class="container">
        <Spinner
            :type="'fullscreen-overlay'"
            :isVisible="isLoading"
            message="twofaccounts.scanning_page_for_qr"
        />
        
        <div v-if="!isLoading && accountData">
            <!-- Account data preview will be implemented later -->
            <div class="has-text-centered">
                <p>{{ $t('message.account_preview_ready') }}</p>
                <p class="mt-2">Service: {{ accountData.service }}</p>
                <p>Account: {{ accountData.account }}</p>
            </div>
        </div>
        
        <div v-if="!isLoading && errorMessage" class="has-text-centered">
            <p class="has-text-danger">{{ errorMessage }}</p>
            <button class="button is-link mt-4" @click="router.push({ name: 'accounts' })">
                {{ $t('label.back') }}
            </button>
        </div>
    </div>
</template>
