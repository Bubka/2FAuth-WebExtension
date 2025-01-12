import './assets/popup.scss'

import Notifications from '@kyvg/vue3-notification'
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createPersistedStatePlugin } from 'pinia-plugin-persistedstate-2'
import { storage } from 'webextension-polyfill'
import Popup from './Popup.vue'
import router from './router'
import i18n from '../i18n'

const popup = createApp(Popup)

// Localization
popup.use(i18n)

// Stores
const pinia = createPinia()
const persistedStatePlugin = createPersistedStatePlugin({
    overwrite: true,
    storage: {
        getItem: async (key) => {
            return storage.local.get(key).then((result) => {
                return Promise.resolve(result[key])
            })
        },
        setItem: async (key, value) => {
            return storage.local.set({
                [key]: value,
            })
        },
        removeItem: async (key) => {
            return storage.local.remove(key)
        },
    },
    // serialize: (value) => JSON.stringify(value),
    // deserialize: (value) => JSON.parse(value),
})
pinia.use((context) => {
    if (['settings', 'preferences'].includes(context.store.$id)) {
        persistedStatePlugin(context)
    }
})
popup.use(pinia)

// Router
popup.use(router)

// Notifications
popup.use(Notifications)

// Global components registration
import FontAwesomeIcon   from './icons'
import Modal             from '@popup/layouts/Modal.vue'
import FormField         from '@popup/components/formElements/FormField.vue'
import FormPasswordField from '@popup/components/formElements/FormPasswordField.vue'
import FormTextarea      from '@popup/components/formElements/FormTextarea.vue'
import FieldError        from '@popup/components/formElements/FieldError.vue'
import ButtonBackCloseCancel from '@popup/components/formElements/ButtonBackCloseCancel.vue'
import Footer            from '@popup/layouts/Footer.vue'
import VueButton         from '@popup/components/formElements/Button.vue'

popup
    .component('FontAwesomeIcon', FontAwesomeIcon)
    .component('Modal', Modal)
    .component('FormField', FormField)
    .component('FormPasswordField', FormPasswordField)
    .component('FormTextarea', FormTextarea)
    .component('FieldError', FieldError)
    .component('ButtonBackCloseCancel', ButtonBackCloseCancel)
    .component('VueFooter', Footer)
    .component('VueButton', VueButton)

popup.mount('#popup')

import { usePreferenceStore } from '@/stores/preferenceStore'
const preferenceStore = usePreferenceStore()
preferenceStore.applyTheme()
preferenceStore.resetGroupFilter()