import { httpClientFactory } from '@popup/services/httpClientFactory'

const apiClient = httpClientFactory('api')

export default {
    /**
     * 
     * @returns 
     */
    getAll() {
        return apiClient.get('groups')
    },
}