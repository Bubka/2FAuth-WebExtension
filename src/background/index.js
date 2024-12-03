import { onMessage, sendMessage } from "webext-bridge/background"

browser.runtime.onInstalled.addListener((details) => {
    console.log('Extension installed:', details);
});

self.onerror = function (message, source, lineno, colno, error) {
    console.info(
        `Error: ${message}\nSource: ${source}\nLine: ${lineno}\nColumn: ${colno}\nError object: ${error}`
    )
}
