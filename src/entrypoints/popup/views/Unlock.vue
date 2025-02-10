<script setup>
    import { useNotifyStore } from '@popup/stores/notify'
    import FormButtons from '@popup/components/formElements/FormButtons.vue'
    
    const { t } = useI18n({ useScope: "global" })
    const notify = useNotifyStore()
    const router = useRouter()
    const isBusy = ref(false)
    const pwd = ref(null)
    const errors = ref(null)

    async function unlock() {
        console.log('Entering unlock function')
        // if (pwd.value && pwd.value.length > 0) {
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
                console.log('💀 Cannot unlock: ', t(reason))
                notify.alert({ text: t('error.wrong_password') })
            }
        // }
    }

</script>

<template>
    <div>
        <h1 class="title has-text-grey-dark" v-html="$t('title.popup.twofauth')"></h1>
        <p class="block">
            {{ $t('message.unlock_description') }}
        </p>
        <form id="frmUnlock" @submit.prevent="unlock">
            <FormPasswordField v-model="pwd" fieldName="password" :fieldError="errors" label="field.extPassword.label" autocomplete="current-password" />
            <FormButtons :isBusy="isBusy" caption="message.unlock" submitId="btnUnlock"/>
        </form>
    </div>
    <VueFooter>
        <router-link id="lnkReset" :to="{ name: 'reset' }" class="has-text-grey">
            {{ $t('link.reset_extension') }}
        </router-link>
    </VueFooter>
</template>
