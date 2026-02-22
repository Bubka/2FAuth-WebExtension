<script setup>
    import { openUrlInNewTab } from '@popup/composables/helpers'

    const { t } = useI18n()
    const router = useRouter()

    function openGuide() {
        const guideUrl = browser.runtime.getURL('guides/firefox-popup-guide.html')
        openUrlInNewTab(guideUrl)
        window.close()
    }

    function continueToAccounts() {
        router.push({ name: 'accounts' })
    }
</script>

<template>
    <StackLayout :should-grow="false">
        <template #content>
            <div class="mt-5">
                <h1 class="title">{{ $t('heading.browser_restrictions') }}</h1>
                <div class="block">
                    <p class="mb-4">{{ $t('message.firefox_popup_restriction_info') }}</p>
                    <p class="mb-4">{{ $t('message.workaround_available') }}</p>
                </div>
            </div>
        </template>
        <template #footer>
            <VueFooter>
                <div class="buttons is-centered">
                    <VueButton @click="openGuide" id="btnShowStepByStepGuide" color="is-link" nativeType="button">
                        {{ $t('label.show_me') }}
                    </VueButton>
                    <VueButton @click="continueToAccounts" id="btnMaybeLater" color="is-text" nativeType="button">
                        {{ $t('label.maybe_later') }}
                    </VueButton>
                </div>
            </VueFooter>
        </template>
    </StackLayout>
</template>
