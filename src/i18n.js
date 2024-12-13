import { createI18n } from 'vue-i18n';
import { en } from '@/langs'

const i18n = createI18n({
    legacy: false,
    locale: 'en',
    fallbackLocale: 'en',
    globalInjection: true,
    messages: {
        en: en,
    }
})

export default i18n;