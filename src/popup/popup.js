import './assets/popup.scss'

import Notifications from '@kyvg/vue3-notification'
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import Popup from './Popup.vue'
import router from './router'
import FontAwesomeIcon from './icons'
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
popup
    .component('FontAwesomeIcon', FontAwesomeIcon)

popup.mount('#popup')