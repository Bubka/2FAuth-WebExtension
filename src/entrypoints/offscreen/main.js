browser.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg === 'checkDarkTheme') {
        sendResponse(matchMedia('(prefers-color-scheme: dark)').matches)
    }
})