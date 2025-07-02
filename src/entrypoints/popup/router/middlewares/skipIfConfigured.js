export default async function skipIfConfigured({ to, next, nextMiddleware, stores }) {
    console.log('[EXT:MW:skipIfConfigured] Entering middleware to reach the ' + to.name + ' view')
    const { settingStore } = stores

    await settingStore.$persistedState.isReady()

    if (settingStore.isConfigured) {
        console.log('[EXT:MW:skipIfConfigured] Extension already configured, moving to the accounts view')
        next({ name: 'accounts' })
    } else {
        nextMiddleware()
    }
}