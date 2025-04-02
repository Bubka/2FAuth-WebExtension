<script setup>
    import { useNotifyStore } from '@popup/stores/notify'
    import FormButtons from '@popup/components/formElements/FormButtons.vue'
    import { isFilled } from '@popup/composables/validators'
    
    const { t } = useI18n({ useScope: "global" })
    const notify = useNotifyStore()
    const router = useRouter()
    const isBusy = ref(false)
    const pwd = ref(null)
    const errors = ref({
        pwd: '',
    })

    async function unlock() {
        const hasValidPassword = validatePassword()

        if (hasValidPassword) {
            isBusy.value = true

            const { status: setEncKeyStatus } = await sendMessage('SET_ENC_KEY', { password: pwd.value }, 'background')
            
            if (! setEncKeyStatus) {
                isBusy.value = false
                notify.alert({ text: t('error.encryption_key_generation_failed') })
                return
            }

            const { status: unlockingStatus, reason } = await sendMessage('UNLOCK', { }, 'background')
            isBusy.value = false

            if (unlockingStatus) {
                router.push({ name: 'accounts' })
            }
            else {
                console.log('[EXT:VIEW] 💀 Cannot unlock: ', t(reason))
                notify.alert({ text: t('error.wrong_password') })
            }
        }
    }

    function validatePassword() {
        errors.value.pwd = ''

        if (! isFilled(pwd.value)) {
            errors.value.pwd = t('message.field_is_required')
            return false
        }

        return true
    }

</script>

<template>
    <div>
        <h1 class="title has-text-grey-dark" v-html="$t('title.popup.twofauth')"></h1>
        <p class="block">
            {{ $t('message.unlock_description') }}
        </p>
        <form id="frmUnlock" @submit.prevent="unlock">
            <FormPasswordField v-model="pwd" fieldName="password" :fieldError="errors.pwd" label="field.extPassword.label" autocomplete="current-password" />
            <FormButtons :isBusy="isBusy" caption="message.unlock" submitId="btnUnlock"/>
        </form>
    </div>
    <VueFooter>
        <router-link id="lnkReset" :to="{ name: 'reset' }" class="has-text-grey">
            {{ $t('link.reset_extension') }}
        </router-link>
    </VueFooter>
</template>
