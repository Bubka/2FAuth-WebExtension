export default async function checkLock({ to, next, nextMiddleware }) {
    console.log('[EXT:MW:checkLock] Entering middleware to reach the ' + to.name + ' view')
    const { locked } = await sendMessage('CHECK_IS_LOCKED', { }, 'background')

    if (locked) {
        console.log('[EXT:MW:checkLock] Extension locked, moving to the Unlock view')
        next({ name: 'unlock' })
    } else {
        nextMiddleware()
    }
}