import './assets/popup.scss'

import Notifications from '@kyvg/vue3-notification'
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import Popup from './Popup.vue'
import router from './router'
import i18n from '../i18n';

const popup = createApp(Popup)
const pinia = createPinia()

// Localization
popup.use(i18n)

// Stores
popup.use(pinia)

// Router
popup.use(router)

// Notifications
popup.use(Notifications)

// Global components registration
import FontAwesomeIcon   from './icons'
import Footer            from '@popup/layouts/Footer.vue'
popup
    .component('FontAwesomeIcon', FontAwesomeIcon)
    .component('VueFooter', Footer)

popup.mount('#popup')