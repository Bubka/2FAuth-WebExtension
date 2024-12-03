<script setup>
    import { ref, computed, watch, onMounted } from 'vue'
    import { useNotifyStore } from '@popup/stores/notify'
    import { useRouter, useRoute } from 'vue-router'
    
    const errorHandler = useNotifyStore()
    const route = useRoute()

    const showDebug = true

    const props = defineProps({
        closable: {
            type: Boolean,
            default: true
        }
    })

    onMounted(() => {
        if (route.query.err) {
            errorHandler.message = 'errors.' + route.query.err
        }
    })

</script>

<template>
    <div>
            <div class="error-message" v-if="$route.name == '404' || $route.name == 'notFound'">
                <p class="error-404"></p>
                <p>{{ $t('errors.resource_not_found') }}</p>
            </div>
            <div v-else class="error-message" >
                <p class="error-generic"></p>
                <p>{{ $t('errors.error_occured') }} </p>
                <p v-if="errorHandler.message" class="has-text-grey-lighter">{{ errorHandler.message }}</p>
                <p v-if="errorHandler.originalMessage" class="has-text-grey-lighter">{{ errorHandler.originalMessage }}</p>
                <p v-if="showDebug && errorHandler.debug" class="is-size-7 is-family-code"><br>{{ errorHandler.debug }}</p>
            </div>
    </div>
</template>