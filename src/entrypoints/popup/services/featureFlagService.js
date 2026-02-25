import { httpClientFactory } from '@popup/services/httpClientFactory'

const apiClient = httpClientFactory('api')

export default {
    getAll() {
        return apiClient.get('features')
    },

    get(featureName, config = {}) {
        return apiClient.get('/features/' + featureName, { ...config })
    },
}