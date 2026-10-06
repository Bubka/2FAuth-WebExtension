export default async function checkLock({ to }) {
    if (import.meta.env.DEV)
        console.log('[EXT:MW:checkLock] Entering middleware to reach the ' + to.name + ' view')

    const { locked } = await sendMessage('CHECK_IS_LOCKED', { }, 'background')

    if (locked) {
        if (import.meta.env.DEV)
            console.log('[EXT:MW:checkLock] Extension locked, moving to the Unlock view')

        return { name: 'unlock' }
    }

    return true
}