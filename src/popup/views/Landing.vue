<script setup>
    const version = __VERSION__
    const displayName = __DISPLAY_NAME__
    const gitURL = __GITHUB_URL__

</script>

<template>
    <div>
        <h1 class="title has-text-grey-dark" v-html="$t('title.popup')"></h1>
        <div class="block">
            {{ $t('message.hello') }}
        </div>
        <RouterLink :to="{ name: 'help' }">{{ $t('title.help') }}</RouterLink>
        <p>{{ version }}</p>
    </div>
</template>
