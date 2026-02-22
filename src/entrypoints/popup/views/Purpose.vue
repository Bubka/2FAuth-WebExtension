<script setup>
    import { openUrlInNewTab } from '@popup/composables/helpers'
    import { LucideExternalLink } from 'lucide-vue-next'

    const router = useRouter()
    
</script>

<template>
    <StackLayout :should-grow="false">
        <template #content>
            <div class="my-5">
                <h1 class="title">{{ $t('heading.purpose') }}</h1>
                <p class="block">
                    {{ $t('message.purpose_description') }}
                </p>
                <p class="block">
                    {{ $t('message.purpose_requirements') }}
                </p>
                <p class="block">
                    {{ $t('message.help_colon') }}
                    <a @click="openUrlInNewTab('https://docs.2fauth.app/api/#creating-an-access-token')">
                        <span class="icon-text">
                            <span>{{ $t('link.docs_how_to_create_a_pat') }}</span>
                            <span class="icon"><LucideExternalLink class="icon-size-1"/></span>
                        </span>
                    </a>
                </p>
            </div>
        </template>
        <template #footer>
            <VueFooter>
                <NavigationButton action="back" @goback="router.push({ name: 'landing' })" :previous-page-title="$t('title.landing')" />
            </VueFooter>
        </template>
    </StackLayout>
</template>
