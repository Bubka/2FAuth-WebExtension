<script setup>

</script>

<template>
    <div>
        <h1 class="title has-text-grey-dark" v-html="$t('title.popup.twofauth')"></h1>
        <p class="block">{{ $t('message.bind_2fauth_to_use_extension') }}</p>
        <p class="block has-text-centered">
            <RouterLink id="btnConfigureMe" class="mt-4 button is-link is-rounded is-main is-medium" :to="{ name: 'setup' }">{{ $t('message.configure') }}</RouterLink>
        </p>
    </div>
    <VueFooter>
        <router-link id="lnkWhy" :to="{ name: 'purpose' }" class="has-text-grey">
            {{ $t('link.why_this') }}
        </router-link>
    </VueFooter>
</template>
