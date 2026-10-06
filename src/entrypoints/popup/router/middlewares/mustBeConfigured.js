export default async function mustBeConfigured({ to, stores }) {
    if (import.meta.env.DEV)
        console.log('[EXT:MW:mustBeConfigured] Entering middleware to reach the ' + to.name + ' view')
    
    const { settingStore } = stores

    await settingStore.$persistedState.isReady()

    if (! (settingStore.isConfigured)) {
        if (import.meta.env.DEV)
            console.log('[EXT:MW:mustBeConfigured] Extension not configured, moving to the Landing view')
        
        return { name: 'landing' }
    }

    return true
}