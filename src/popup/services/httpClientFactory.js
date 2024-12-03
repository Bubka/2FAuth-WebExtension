import axios from "axios"
import { useNotifyStore } from '@popup/stores/notify'

export const httpClientFactory = () => {
	let baseURL = 'https://testing.2fauth.app/api/v1'
    let token = ''

	const httpClient = axios.create({
		baseURL,
		headers: { 'Authorization': 'Bearer ' + token , 'X-Requested-With': 'XMLHttpRequest', 'Content-Type': 'application/json' },
		withCredentials: false,
        withXSRFToken: false,
	})

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