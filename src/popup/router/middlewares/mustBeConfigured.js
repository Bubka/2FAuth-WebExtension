export default async function mustBeConfigured({ to, next, nextMiddleware, stores }) {
    const { settingStore } = stores

    await settingStore.$persistedState.isReady()

    if (! (settingStore.hostUrl.length > 0)) {
        next({ name: 'landing' })
    } else {
        nextMiddleware()
    }
}