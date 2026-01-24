import { httpClientFactory } from '@popup/services/httpClientFactory'

const apiClient = httpClientFactory('api')

export default {
    /**
     * Decode a QR code image
     * 
     * @param {Blob} imageBlob - The QR code image as a Blob
     * @param {Object} config - Axios config options
     * @returns {Promise} - Promise resolving to the decoded QR code data
     */
    decode(imageBlob, config = {}) {
        const formData = new FormData()
        formData.append('qrcode', imageBlob, 'qrcode.png')
        
        return apiClient.post('/qrcode/decode', formData, {
            ...config,
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        })
    },
}
