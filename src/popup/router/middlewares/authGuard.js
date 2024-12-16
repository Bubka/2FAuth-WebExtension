// import authService from '@/services/authService'

export default async function authGuard({ to, next, nextMiddleware, stores }) {
    const { extensionStore } = stores

    if (! extensionStore.isConfigured) {
        next({ name: 'landing' })
    } else {
        nextMiddleware()
    }
}