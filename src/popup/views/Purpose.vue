<script setup>
    import { openUrlInNewTab } from '@popup/composables/helpers'
    
</script>

<template>
    <div>
        <h1 class="title has-text-grey-dark" v-html="$t('title.popup.purpose')"></h1>
        <p class="block">
            {{ $t('message.purpose_description') }}
        </p>
        <p class="block">
            {{ $t('message.purpose_requirements') }}
        </p>
        <p class="block">
            <a @click="openUrlInNewTab('https://docs.2fauth.app/api/#creating-an-access-token')">
                {{ $t('message.docs_how_to_create_a_pat') }} <FontAwesomeIcon :icon="['fas', 'arrow-up-right-from-square']" size="xs" />
            </a>
        </p>
    </div>
    <VueFooter>
        <VueFooter :showButtons="true">
            <ButtonBackCloseCancel :returnTo="{ name: 'landing' }" action="back" />
        </VueFooter>
    </VueFooter>
</template>
