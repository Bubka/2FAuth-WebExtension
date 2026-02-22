<script setup>
    import { useResetExtension } from '@popup/composables/resetter'

    const { t } = useI18n()
    const router = useRouter()

    const isReseting = ref(false)

    function resetExtension() {
        if(confirm(t('confirmation.are_you_sure'))) {
            useResetExtension()
        }
    }

</script>

<template>
    <StackLayout :should-grow="false">
        <template #content>
            <div class="mt-5 mb-5">
                <h1 class="title">{{ $t('heading.reset_extension') }}</h1>
                <p class="block">{{ $t('message.reset_extension_description_bis') }}</p>
                <p class="block">{{ $t('message.reset_extension_description') }}</p>
                <p class="block">{{ $t('message.token_remains_valid') }}</p>
                <form>
                    <VueButton nativeType="submit" @click="resetExtension" :isLoading="isReseting" id="btnResetExtension" color="is-danger">
                        {{ $t('label.reset_extension') }}
                    </VueButton>
                </form>
            </div>
        </template>
        <template #footer>
            <VueFooter>
                <NavigationButton action="back" @goback="router.push({ name: 'unlock' })" :previous-page-title="$t('title.unlock')" />
            </VueFooter>
        </template>
    </StackLayout>
</template>
