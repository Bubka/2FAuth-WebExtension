// import authService from '@/services/authService'

export default async function authGuard({ to, next, nextMiddleware, stores }) {
    const { settingStore } = stores

    if (! settingStore.isConfigured) {
        next({ name: 'landing' })
    } else {
        nextMiddleware()
    }
}