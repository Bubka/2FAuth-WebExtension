import axios from "axios"
import { useNotifyStore } from '@popup/stores/notify'
import { useExtensionStore } from '@/stores/extensionStore'

export const httpClientFactory = () => {

	const httpClient = axios.create({
		withCredentials: false,
        withXSRFToken: false,
	})


	httpClient.interceptors.request.use(
        async function (config) {
            const extensionStore = useExtensionStore()

            if (Object.prototype.hasOwnProperty.call(config, 'ignoreRequestInterceptor') && config.ignoreRequestInterceptor === true) {
                return config
            }

            config.baseURL = extensionStore.hostUrl + '/api/v1'
		    config.headers = {
                ...config.headers,
                ...{ 'Authorization': 'Bearer ' + extensionStore.apiToken , 'X-Requested-With': 'XMLHttpRequest', 'Content-Type': 'application/json' }
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
            if (Object.prototype.hasOwnProperty.call(error.config, 'returnError') && error.config.returnError === true) {
                return Promise.reject(error)
            }
            
            if (error.response && [401].includes(error.response.status)) {
                useNotifyStore().forbidden()
                return new Promise(() => {})
            }

            // Always return the form validation errors
            if (error.response.status === 422) {
                return Promise.reject(error)
            }

            // Not found
            if (error.response.status === 404) {
                useNotifyStore().notFound()
                return new Promise(() => {})
            }

            useNotifyStore().error(error)
            return new Promise(() => {})
        }
    )

	return httpClient
}