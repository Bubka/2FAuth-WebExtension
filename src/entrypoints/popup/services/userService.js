import { httpClientFactory } from '@popup/services/httpClientFactory'

const apiClient = httpClientFactory('api')

export default {
    /**
     * Get current signed-in user
     * 
     * @returns promise
     */
    get(config = {}) {
        return apiClient.get('/user', { ...config })
    },

    /**
     * Get current signed-in user preferences
     * 
     * @returns promise
     */
    getPreferences(config = {}) {
        return apiClient.get('/user/preferences', { ...config })
    },
    
}