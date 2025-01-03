import { defineStore } from 'pinia'

export const useSettingStore = defineStore('settingStore', {

    state: () => {
        return {
            apiToken: '',
            hostUrl: '',
            extPassword: '',
        }
    },

    getters: {
      isConfigured: (state) => state.hostUrl.length > 0 && state.apiToken.length > 0,
      apiTokenPartial: (state) => state.apiToken.substring(0, 10) + ' ... ' + state.apiToken.slice(-10),
    },

    actions: {
        
    },
})
