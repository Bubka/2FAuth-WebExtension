<script setup>
    import { useResetExtension } from '@popup/composables/resetter'
    const { t } = useI18n({ useScope: "global" })

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
        <form>
            <VueButton @click="resetExtension" :isLoading="isReseting" id="btnResetExtension" color="is-danger">
                {{ $t('message.reset_extension') }}
            </VueButton>
        </form>
    </div>
    <VueFooter>
        <VueFooter :showButtons="true">
            <ButtonBackCloseCancel :returnTo="{ name: 'unlock' }" action="back" />
        </VueFooter>
    </VueFooter>
</template>
