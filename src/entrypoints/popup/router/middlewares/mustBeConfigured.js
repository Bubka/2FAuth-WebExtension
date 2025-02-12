export default async function mustBeConfigured({ to, next, nextMiddleware, stores }) {
    console.log('[EXT:MW:mustBeConfigured] Entering middleware to reach the ' + to.name + ' view')
    const { settingStore } = stores

    await settingStore.$persistedState.isReady()

    if (! (settingStore.hostUrl.length > 0)) {
        console.log('[EXT:MW:mustBeConfigured] Extension not configured, moving to the Landing view')
        next({ name: 'landing' })
    } else {
        nextMiddleware()
    }
}