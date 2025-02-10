<script setup>
    import { LucideLoaderCircle } from 'lucide-vue-next';

    const props = defineProps({
        isVisible: Boolean,
        type: {
            type: String,
            default: 'inline'
        },
        message: {
            type: String,
            default: 'message.generating_otp'
        },
        rawSize: {
            type: Number,
            default: 24
        },
    })
</script>

<template>
    <div v-if="isVisible">
        <div v-if="type == 'fullscreen'" class="spinner-container">
            <div class="spinner-wrapper">
                <span id="icnSpinnerFull" class="is-size-1 spinner">
                     <LucideLoaderCircle class="spinning icon-size-3" />
                </span>
                <span>{{ $t(message) }}</span>
            </div>
        </div>
        <div v-if="type == 'fullscreen-overlay'" class="spinner-overlay-container">
            <div class="spinner-wrapper">
                <span id="icnSpinnerFull" class="is-size-1 spinner">
                    <LucideLoaderCircle class="spinning icon-size-3"  />
                </span>
                <span>{{ $t(message) }}</span>
            </div>
        </div>
        <LucideLoaderCircle v-else-if="type == 'raw'" class="spinning lucide-default-size" :size="rawSize"  />
        <div v-else class="has-text-centered mt-6">
            <span id="icnSpinner" class="is-size-4">
                <LucideLoaderCircle class="spinning" />
            </span>
        </div>
    </div>
</template>

<style scoped>
.spinner-container,
.spinner-overlay-container {
    text-align: center;
    z-index: 100000;
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    align-items: center;
    justify-content: center;
}
.spinner-container,
.spinner-overlay-container {
    top: 25%;
    height: 50%;
}
.spinner {
    display: block;
}
</style>
