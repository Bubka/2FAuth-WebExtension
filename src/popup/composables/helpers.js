import { useExtensionStore } from '@/stores/extensionStore'
import { tabs } from 'webextension-polyfill'

export function openUrlInNewTab(url) {
	tabs.create({
		active: true,
		url: url,
	})
}

export function useIdGenerator(fieldType, fieldName) {
	let prefix
	fieldName = fieldName.toString()

	switch (fieldType) {
		case 'text':
			prefix = 'txt'
			break
		case 'button':
			prefix = 'btn'
			break
		case 'email':
			prefix = 'eml'
			break
		case 'password':
			prefix = 'pwd'
			break
		case 'radio':
			prefix = 'rdo'
			break
		case 'label':
			prefix = 'lbl'
			break
		case 'select':
			prefix = 'sel'
			break
		case 'legend':
			prefix = 'leg'
			break
		case 'error':
			prefix = 'err'
			break
		default:
			prefix = 'txt'
			break
	}

	return {
		inputId: prefix + fieldName[0].toUpperCase() + fieldName.toLowerCase().slice(1)
	}
}

export function useValidationErrorIdGenerator(field) {
	return {
		valErrorId: 'valError' + field[0].toUpperCase() + field.toLowerCase().slice(1)
	}
}

export function useDisplayablePassword(pwd, reveal = false) {
    const extensionStore = useExtensionStore()

	if (extensionStore.formatPassword && pwd.length > 0) {
		const x = Math.ceil(extensionStore.formatPasswordBy < 1
			? pwd.length * extensionStore.formatPasswordBy
			: extensionStore.formatPasswordBy)
			
		const chunks = pwd.match(new RegExp(`.{1,${x}}`, 'g'));
		if (chunks) {
			pwd = chunks.join(' ')
		}
	}

	return extensionStore.showOtpAsDot && !reveal ? pwd.replace(/[0-9]/g, '●') : pwd
}

export function startsWithUppercase(str) {
    return str.substr(0, 1).match(/[A-Z\u00C0-\u00DC]/);
}