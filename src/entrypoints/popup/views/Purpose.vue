<script setup>
    import { openUrlInNewTab } from '@popup/composables/helpers'
    import { LucideExternalLink } from 'lucide-vue-next'

    const router = useRouter()
    
</script>

<template>
    <div>
        <h1 class="title has-text-grey-dark" v-html="$t('title.purpose')"></h1>
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
                    <span>{{ $t('message.docs_how_to_create_a_pat') }}</span>
                    <span class="icon"><LucideExternalLink class="icon-size-1"/></span>
                </span>
            </a>
        </p>
    </div>
    <VueFooter>
        <VueFooter :showButtons="true">
            <NavigationButton action="back" @goback="router.push({ name: 'landing' })" />
        </VueFooter>
    </VueFooter>
</template>
