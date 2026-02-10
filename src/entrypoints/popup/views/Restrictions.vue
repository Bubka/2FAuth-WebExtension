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
    <div>
        <h1 class="title has-text-grey-dark">{{ $t('heading.browser_restrictions') }}</h1>
        <div class="block">
            <p class="mb-4">{{ $t('message.firefox_popup_restriction_info') }}</p>
            <p class="mb-4">{{ $t('message.workaround_available') }}</p>
        </div>
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
    </div>
</template>
