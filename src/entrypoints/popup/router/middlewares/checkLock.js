import { sendMessage } from 'webext-bridge/popup'

export default async function checkLock({ to, next, nextMiddleware }) {
    console.log('[MW: checkLock] Entering middleware to reach the ' + to.name + ' view')
    const { locked } = await sendMessage('CHECK_LOCKED', { }, 'background')

    if (locked) {
        console.log('[MW: checkLock] Extension locked, moving to the Unlock view')
        next({ name: 'unlock' })
    } else {
        nextMiddleware()
    }
}