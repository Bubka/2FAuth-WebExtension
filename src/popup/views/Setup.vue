<script setup>

</script>

<template>
    <div>
        <h1 class="title has-text-grey-dark" v-html="$t('title.popup.setup')"></h1>
        <FormField v-model="hostUrl" fieldName="hostUrl" :fieldError="errors" inputType="text" label="field.hostUrl.label" help="field.hostUrl.help" />
        <FormTextarea v-model="apiToken" :fieldError="errors" fieldName="apiToken" rows="4" label="field.apiToken.label"  help="field.apiToken.help" :size="'is-small'" />
        <FormPasswordField v-model="extPassword" fieldName="extPassword" :fieldError="errors" :showRules="true" label="field.extPassword.label"  help="field.extPassword.help" autocomplete="new-password" />
    </div>

    <VueFooter :showButtons="true">
        <ButtonBackCloseCancel :returnTo="{ name: 'accounts' }" action="close" />
    </VueFooter>
</template>
