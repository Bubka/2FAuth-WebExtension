
export function openUrlInNewTab(url) {
	browser.tabs.create({
		active: true,
		url: url,
	})
}

export function startsWithUppercase(str) {
    return str.substr(0, 1).match(/[A-Z\u00C0-\u00DC]/);
}