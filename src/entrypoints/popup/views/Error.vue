<script setup>
    import { ref, computed, watch, onMounted } from 'vue'
    import { useErrorHandler } from '@2fauth/stores'
    import { useRouter, useRoute } from 'vue-router'
    
    const errorHandler = useErrorHandler()
    const router = useRouter()
    const route = useRoute()

    const showModal = ref(true)
    const showDebug = computed(() => process.env.NODE_ENV === 'development')

    const props = defineProps({
        closable: {
            type: Boolean,
            default: true
        }
    })

    watch(showModal, (val) => {
        if (val == false) {
            exit()
        }
    })

    onMounted(() => {
        if (route.query.err) {
            errorHandler.message = 'errors.' + route.query.err
        }
    })

    /**
     * Exits the error view
     */
    function exit() {
        window.history.length > 1 && route.name !== '404' && route.name !== 'notFound' && !route.query.err
            ? router.go(-1)
            : router.push({ name: 'accounts' })
    }

</script>

<template>
    <div class="modal-error">
        <Modal v-model="showModal" :isFullHeight="true">
            <div class="error-message" v-if="$route.name == '404' || $route.name == 'notFound'">
                <p class="error-404"></p>
                <p>{{ $t('message.resource_not_found') }}</p>
            </div>
            <div v-else class="error-message" >
                <p class="error-generic"></p>
                <p>{{ $t('message.error_occured') }} </p>
                <p v-if="errorHandler.message" class="has-text-grey-lighter">{{ errorHandler.message }}</p>
                <p v-if="errorHandler.originalMessage" class="has-text-grey-lighter">{{ errorHandler.originalMessage }}</p>
                <p v-if="showDebug && errorHandler.debug" class="is-size-7 is-family-code pt-3">{{ errorHandler.debug }}</p>
            </div>
        </Modal>
    </div>
</template>