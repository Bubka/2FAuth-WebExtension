<script setup>

</script>

<template>
    <StackLayout :should-grow="false">
        <template #content>
            <div class="mt-5">
                <h1 class="title">{{ $t('heading.twofauth_webext') }}</h1>
                <p class="block">{{ $t('message.bind_2fauth_to_use_extension') }}</p>
                <p class="block has-text-centered pt-5 pb-6">
                    <RouterLink id="btnConfigureMe" class="button is-link is-rounded is-main is-medium" :to="{ name: 'setup' }">
                        {{ $t('link.configure') }}
                    </RouterLink>
                </p>
            </div>
        </template>
        <template #footer>
            <VueFooter>
                <router-link id="lnkWhy" :to="{ name: 'purpose' }" class="has-text-grey">
                    {{ $t('link.why_this') }}
                </router-link>
            </VueFooter>
        </template>
    </StackLayout>
</template>
