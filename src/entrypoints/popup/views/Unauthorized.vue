<script setup>
    import { useResetExtension } from '@popup/composables/resetter'

    const { t } = useI18n()
    const router = useRouter()

    const isRefreshing = ref(false)
    const isReseting = ref(false)

    function refresh() {
        router.push({ name: 'accounts' })
    }

    function resetExtension() {
        if(confirm(t('confirmation.are_you_sure'))) {
            useResetExtension()
        }
    }

</script>

<template>
    <StackLayout :should-grow="false">
        <template #content>
            <div class="mt-5">
                <h1 class="title">{{ $t('heading.unauthorized') }}</h1>
                <p class="block">{{ $t('message.authentication_against_server_failed') }}</p>
                <p class="block">{{ $t('message.is_pat_still_valid') }}</p>
                <p class="block">{{ $t('message.retry_or_reset_extension') }}</p>
            </div>
        </template>
        <template #footer>
            <VueFooter>
                <div class="field is-grouped">
                    <p class="control">
                        <VueButton nativeType="button" @click="refresh" :isLoading="isRefreshing" id="btnRefresh">
                            {{ $t('label.refresh') }}
                        </VueButton>
                    </p>
                    <p class="control">
                        <VueButton nativeType="button" @click="resetExtension" :isLoading="isReseting" id="btnResetExtension" color="is-danger">
                            {{ $t('label.reset_extension') }}
                        </VueButton>
                    </p>
                </div>
            </VueFooter>
        </template>
    </StackLayout>
</template>
