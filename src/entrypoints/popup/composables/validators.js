export function isFilled(value) {
	return value?.toString().length > 0
}

export function isHttpUrl(value) {
	return value?.toString().startsWith('http://') || value.startsWith('https://') 
}