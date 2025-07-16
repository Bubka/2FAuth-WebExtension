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
    <div>
        <h1 class="title has-text-grey-dark" v-html="$t('heading.unauthorized')"></h1>
        <p class="block">{{ $t('message.authentication_against_server_failed') }}</p>
        <p class="block">{{ $t('message.is_pat_still_valid') }}</p>
        <p class="block">{{ $t('message.retry_or_reset_extension') }}</p>
        <form>
            <div class="field is-grouped">
                <p class="control">
                    <VueButton nativeType="submit" @click="refresh" :isLoading="isRefreshing" id="btnRefresh">
                        {{ $t('label.refresh') }}
                    </VueButton>
                </p>
                <p class="control">
                    <VueButton nativeType="submit" @click="resetExtension" :isLoading="isReseting" id="btnResetExtension" color="is-danger">
                        {{ $t('label.reset_extension') }}
                    </VueButton>
                </p>
            </div>
        </form>
    </div>
</template>
