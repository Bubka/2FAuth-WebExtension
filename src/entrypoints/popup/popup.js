import './assets/popup.scss'

import Notifications from '@kyvg/vue3-notification'
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createPersistedStatePlugin } from 'pinia-plugin-persistedstate-2'
import Popup from './Popup.vue'
import router from './router'
import { devtools } from '@vue/devtools'

if ('development' == process.env.NODE_ENV)
    devtools.connect() // default is 'http://localhost:8098'

const popup = createApp(Popup)

// Localization
popup.use(i18n)

// Stores
const pinia = createPinia()
const persistedStatePlugin = createPersistedStatePlugin({
    overwrite: false,
    storage: {
        getItem: async (key) => {
            return storage.getItem('local:' + key).then((result) => {
                return Promise.resolve(result)
            })
        },
        setItem: async (key, value) => {
            return storage.setItem('local:' + key, value)
        },
        removeItem: async (key) => {
            return storage.removeItem('local:' + key)
        },
    },
    // serialize: (value) => JSON.stringify(value),
    // deserialize: (value) => JSON.parse(value),
})
pinia.use((context) => {
    context.store.$i18n = i18n
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
import Modal  from '@popup/layouts/Modal.vue'
import Footer from '@popup/layouts/Footer.vue'
import {
    FormField,
    FormPasswordField,
    FormTextarea,
    FormFieldError,
    NavigationButton,
    VueButton
} from '@2fauth/formcontrols'

popup
    .component('Modal', Modal)
    .component('VueFooter', Footer)
    .component('FormField', FormField)
    .component('FormPasswordField', FormPasswordField)
    .component('FormTextarea', FormTextarea)
    .component('FormFieldError', FormFieldError)
    .component('NavigationButton', NavigationButton)
    .component('VueButton', VueButton)

popup.mount('#popup')
