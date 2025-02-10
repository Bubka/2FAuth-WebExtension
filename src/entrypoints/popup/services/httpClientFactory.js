import axios from "axios"
import { useNotifyStore } from '@popup/stores/notify'
import { sendMessage } from 'webext-bridge/popup'
import { useSettingStore } from '@/stores/settingStore'

export const httpClientFactory = () => {

	const httpClient = axios.create({
		withCredentials: false,
        withXSRFToken: false,
	})


	httpClient.interceptors.request.use(
        async function (config) {
            if (Object.prototype.hasOwnProperty.call(config, 'ignoreRequestInterceptor') && config.ignoreRequestInterceptor === true) {
                return config
            }
            
            const settingStore = useSettingStore()
            const { pat } = await sendMessage('GET_PAT', { }, 'background')

            config.baseURL = settingStore.hostUrl + '/api/v1'
		    config.headers = {
                ...config.headers,
                ...{ 'Authorization': 'Bearer ' + pat , 'X-Requested-With': 'XMLHttpRequest', 'Content-Type': 'application/json' }
            }

            return config
        },
        (error) => {
            Promise.reject(error)
        }
    )

    httpClient.interceptors.response.use(
        (response) => {
            return response;
        },
        async function (error) {
            if (error.response && [407].includes(error.response.status)) {
                useNotifyStore().error(error)
                return new Promise(() => {})
            }

            // Return the error when we need to handle it at component level
            if (error.config.hasOwnProperty('returnError') && error.config.returnError === true) {
                return Promise.reject(error)
            }
            
            if (error.response && [401].includes(error.response.status)) {
                useNotifyStore().forbidden()
                return Promise.reject(error)
            }

            // Always return the form validation errors
            if (error.response && [422].includes(error.response.status)) {
                return Promise.reject(error)
            }

            // Not found
            if (error.response && [404].includes(error.response.status)) {
                useNotifyStore().notFound()
                return new Promise(() => {})
            }

            useNotifyStore().error(error)
            return new Promise(() => {})
        }
    )

	return httpClient
}