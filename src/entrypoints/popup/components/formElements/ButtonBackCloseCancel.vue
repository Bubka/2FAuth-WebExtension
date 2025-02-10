<script setup>
    import { useColorMode } from '@vueuse/core'

    const mode = useColorMode()
    
    const props = defineProps({
        returnTo: {
            type: Object,
            default: { name: 'accounts' }
        },
        action: {
            type: String,
            default: 'close'
        },
        useLinkTag: {
            type: Boolean,
            default: true
        },
        isText: {
            type: Boolean,
            default: false
        },
        isCapture: {
            type: Boolean,
            default: false
        },
        isRounded: {
            type: Boolean,
            default: true
        },
    })

    const classes = 'button'
        + (mode.value === 'dark' && ! props.isText && ! props.isCapture ? ' is-dark' : '')
        + (props.isText ? ' is-text' : '')
        + (props.isCapture ? ' is-large is-warning' : '')
        + (props.isRounded ? ' is-rounded' : '')
</script>

<template>
    <!-- back / close / cancel button -->
    <p v-if="useLinkTag" class="control">
        <RouterLink
            v-if="action == 'close'"
            id="btnClose"
            :to="returnTo"
            :class="classes"
            tabindex="0"
            role="button"
            :aria-label="$t('message.close_the_x_page', { pagetitle: $route.meta.title })"
        >
            {{ $t('message.close') }}
        </RouterLink>
        <RouterLink
            v-else-if="action == 'back'"
            id="lnkBack"
            :to="returnTo"
            :class="classes"
            :aria-label="$t('message.close_the_x_page', { pagetitle: $route.meta.title })"
        >
            {{ $t('message.back') }}
        </RouterLink>
        <RouterLink
            v-else-if="action == 'cancel'"
            id="btnCancel"
            :to="returnTo"
            :class="classes"
        >
            {{ $t('message.cancel') }}
        </RouterLink>
    </p>
    <p v-else class="control">
        <button
            v-if="action == 'close'"
            id="btnClose"
            :class="classes"
            @click="$emit('closed')"
            type="button"
        >
            {{ $t('message.close') }}
        </button>
        <button
            v-if="action == 'cancel'"
            id="btnCancel"
            :class="classes"
            @click="$emit('canceled')"
            type="button"
        >
            {{ $t('message.cancel') }}
        </button>
    </p>
</template>