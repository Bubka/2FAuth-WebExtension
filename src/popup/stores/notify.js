import { defineStore } from 'pinia'
import { useNotification } from '@kyvg/vue3-notification'
import { useI18n } from 'vue-i18n'
import router from '@popup/router'

export const useNotifyStore = defineStore('notify', () => {

    const { notify } = useNotification()
    const { t } = useI18n()

    // STATE

    const err = ref(null);
    const message = ref(null);
    const originalMessage = ref(null);
    const debug = ref(null);

    // ACTIONS

    function $reset() {
        err.value = null;
        message.value = null;
        originalMessage.value = null;
        debug.value = null;
    }

    function parseError(error) {
        $reset
        err.value = error

        // Hnalde axios response error
        if (error.response) {
            if (error.response.status === 407) {
                message.value = t('errors.auth_proxy_failed'),
                originalMessage.value = t('errors.auth_proxy_failed_legend')
            }
            else if (error.response.status === 403) {
                message.value = t('errors.unauthorized'),
                originalMessage.value = t('errors.unauthorized_legend')
            }
            else if(error.response.data) {
                message.value = error.response.data.message,
                originalMessage.value = error.response.data.originalMessage ?? null
                debug.value = error.response.data.debug ?? null
            }
        } else {
            message.value = error.message
            debug.value = error.stack ?? null
        }
    }

    function notFound(error) {
        router.push({ name: '404' });
    }

    function error(error) {
        parseError(error);
        router.push({ name: 'genericError' });
    }

    function info(notification) {
        notify({ type: 'is-info', ...notification });
    }

    function success(notification) {
        notify({ type: 'is-success', ...notification });
    }

    function warn(notification) {
        notify({ type: 'is-warning', ...notification });
    }

    function alert(notification) {
        notify({ type: 'is-danger', ...notification });
    }

    function forbidden(notification) {
        notify({ type: 'is-danger', ...notification });
    }

    function action(notification) {
        notify({ type: 'is-dark', ...notification });
    }

    function clear() {
        notify({ clean: true });
    }

    return {
        err,
        message,
        originalMessage,
        debug,
        parseError,
        notFound,
        error,
        info,
        success,
        warn,
        alert,
        forbidden,
        action,
        clear
    };
});
