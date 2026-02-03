<script setup>
    import { LucideScanQrCode } from 'lucide-vue-next'
    
</script>

<template>
    <!-- New item buttons -->
    <p class="control">
        <button 
            type="button"
            class="button is-link is-rounded is-focus"
            @click="$emit('capture-button-clicked')"
            :title="$t('tooltip.detect_qrcode_in_page')" >
            <span>{{ $t('label.detect_qrcode') }}</span>
            <span class="icon is-small">
                <LucideScanQrCode />
            </span>
        </button>
    </p>
</template>