import { sendMessage } from 'webext-bridge/popup'

export default async function checkLock({ to, next, nextMiddleware, stores }) {

    console.log('Entering checkLock middleware to reach ' + to.name)
    const { locked } = await sendMessage('CHECK_LOCKED', { }, 'background')
    console.log('locked', locked)
    if (locked) {
        next({ name: 'unlock' })
    } else {
        nextMiddleware()
    }
}