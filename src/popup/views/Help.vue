<script setup>
    
</script>

<template>
    <div>
        <h1 class="title has-text-grey-dark" v-html="$t('title.help')"></h1>
        <div class="block">
            lsdfnsdfn;n
        </div>
        <RouterLink :to="{ name: 'landing' }">{{ $t('title.popup') }}</RouterLink>
    </div>
</template>
