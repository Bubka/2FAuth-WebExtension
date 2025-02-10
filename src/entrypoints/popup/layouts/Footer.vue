<script setup>
    const props = defineProps({
        showButtons: false,
    })

</script>

<template>
    <footer class="main">
        <!-- action buttons -->
        <div class="columns is-gapless" v-if="showButtons">
            <div class="column has-text-centered">
                <div class="field is-grouped">
                    <slot></slot>
                </div>
            </div>
        </div>
        <!-- sub-links -->
        <div v-else class="content has-text-centered">
            <slot></slot>
        </div>
    </footer>
</template>
