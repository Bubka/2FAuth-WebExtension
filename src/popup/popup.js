import './assets/popup.scss'

import Notifications from '@kyvg/vue3-notification'
import { createApp } from 'vue'
import { createI18n } from 'vue-i18n'
import { createPinia } from 'pinia'
import Popup from './Popup.vue'
import router from './router'
import FontAwesomeIcon from './icons'
import { en } from './langs'

const popup = createApp(Popup)

// Localization
const i18n = createI18n({
    legacy: false,
    locale: 'en',
    fallbackLocale: 'en',
    globalInjection: true,
    messages: {
        en: en,
    }
})
popup.use(i18n)

// Stores
const pinia = createPinia()
pinia.use(({ store }) => {
    store.$i18n = i18n;
});
popup.use(pinia)

// Router
popup.use(router)

// Notifications
popup.use(Notifications)

// Global components registration
popup
    .component('FontAwesomeIcon', FontAwesomeIcon)

popup.mount('#popup')