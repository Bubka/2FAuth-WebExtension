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
import Modal             from '@popup/layouts/Modal.vue'
import FormField         from '@popup/components/formElements/FormField.vue'
import FormPasswordField from '@popup/components/formElements/FormPasswordField.vue'
import FormTextarea      from '@popup/components/formElements/FormTextarea.vue'
import FieldError        from '@popup/components/formElements/FieldError.vue'
import ButtonBackCloseCancel from '@popup/components/formElements/ButtonBackCloseCancel.vue'
import Footer            from '@popup/layouts/Footer.vue'

popup
    .component('FontAwesomeIcon', FontAwesomeIcon)
    .component('Modal', Modal)
    .component('FormField', FormField)
    .component('FormPasswordField', FormPasswordField)
    .component('FormTextarea', FormTextarea)
    .component('FieldError', FieldError)
    .component('ButtonBackCloseCancel', ButtonBackCloseCancel)
    .component('VueFooter', Footer)

popup.mount('#popup')