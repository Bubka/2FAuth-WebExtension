<script setup>
    import { onMessage, sendMessage } from 'webext-bridge/popup'
    import twofaccountService from '@popup/services/twofaccountService'
    import qrcodeService from '@popup/services/qrcodeService'
    import { usePreferenceStore } from '@/stores/preferenceStore'
    import { useSettingStore } from '@/stores/settingStore'
    import { useBusStore } from '@popup/stores/bus'
    import { useNotify, OtpDisplay, QrContentDisplay, Spinner } from '@2fauth/ui'
    import { useI18n } from 'vue-i18n'
    import { useErrorHandler } from '@2fauth/stores'

    const errorHandler = useErrorHandler()
    const { t } = useI18n()
    const preferenceStore = usePreferenceStore()
    const settingStore = useSettingStore()
    const router = useRouter()
    const bus = useBusStore()
    const notify = useNotify()
    const accountParams = ref({
        otp_type: '',
        account: '',
        service: '',
        icon: '',
        secret: '',
        digits: null,
        algorithm: '',
        period: null,
        counter: null,
        image: ''
    })
    const uri = ref()
    const showAlternatives = ref(false)
    const showOtpInModal = ref(false)

    // $refs
    const OtpDisplayForAutoSave = ref(null)
    
    const props = defineProps({
        twofaccountId: [Number, String]
    })

    watch(showOtpInModal, (val) => {
        if (val == false) {
            OtpDisplayForAutoSave.value?.clearOTP()
            router.push({ name: 'accounts' })
        }
    })

    watch(showAlternatives, (val) => {
        if (val == false) {
            router.push({ name: 'accounts' })
        }
    })

    /**
     * Shows rotating OTP for the provided account
     */
    function showOTP(otp) {
        // Data that should be displayed quickly by the OtpDisplay
        // component are passed using props.
        accountParams.value.otp_type = otp.otp_type
        accountParams.value.service = otp.service
        accountParams.value.account = otp.account
        accountParams.value.icon = otp.icon

        nextTick().then(() => {
            showOtpInModal.value = true
            OtpDisplayForAutoSave.value.show(otp.id);
        })
    }

    /**
     * Lock the extension
     */
    function lockExtension() {
        sendMessage('LOCK_EXTENSION', { }, 'background').then(() => {
            router.push('unlock')
        })
    }
    
    /**
     * Upload the passed QR code file to the backend for decoding, then route the user
     * to the Create form with decoded URI to prefill the form
     */
    async function submitQrCode() {
        // Check if there's QR data waiting from a capture
        try {
            const qrBlobData = await sendMessage('GET_QR_BLOB', {}, 'background')
            
            if (qrBlobData.success && qrBlobData.imageBuffer) {
                const blob = new Blob([new Uint8Array(qrBlobData.imageBuffer)], { type: qrBlobData.imageMimeType })
                
                // Decode the QR code by uploading to backend
                qrcodeService.decode(blob, {returnError: true}).then(response => {
                    uri.value = response.data.data
                    bus.hasQR = false

                    twofaccountService.storeFromUri(uri.value).then(async response => {
                        showOTP(response.data)
                    })
                    .catch(error => {
                        if( error.response.data.errors.uri ) {
                            showAlternatives.value = true
                        }
                        else {
                            bus.closeErrorPushTo = 'accounts'
                            errorHandler.show(error)
                        }
                    })
                })
                .catch(error => {
                    bus.closeErrorPushTo = 'accounts'
                    errorHandler.show(error)
                })
            }
            else
            {
                bus.closeErrorPushTo = 'accounts'
                errorHandler.show(error)
            }
        } catch (error) {
            bus.closeErrorPushTo = 'accounts'
            errorHandler.show(error)
        }
        finally {
            bus.hasQR = false
        }
    }

    onMounted(() => {
        if (bus.hasQR) {
            console.log('bus.hasQR', bus.hasQR)
            submitQrCode()
        }
    })

</script>

<template>
    <div class="ext-full-height">
        <!-- otp display modal (when auto-save is enabled) -->
        <Modal v-model="showOtpInModal">
            <OtpDisplay
                ref="OtpDisplayForAutoSave"
                :accountParams="accountParams"
                :preferences="preferenceStore.$state"
                :twofaccountService="twofaccountService"
                :can_showNextOtp="settingStore.hasFeature_showNextOtp"
                :iconPathPrefix="settingStore.hostUrl"
                @please-close-me="router.push({ name: 'accounts' })"
                @kickme="lockExtension"
                @please-update-activeGroup="(newActiveGroup) => preferenceStore.activeGroup = newActiveGroup"
                @otp-copied-to-clipboard="notify.success({ text: t('notification.copied_to_clipboard') })"
                @error="(error) => errorHandler.show(error)"
            />
        </Modal>
        <Spinner
            :type="'fullscreen-overlay'"
            :isVisible="!showOtpInModal && !showAlternatives"
            message="message.parsing_data"
        />
        <!-- alternatives -->
        <Modal v-model="showAlternatives">
            <QrContentDisplay :qrContent="uri" :isCompact="true" />
        </Modal>
    </div>
</template>
