import { defineStore } from 'pinia'

export const useSettingStore = defineStore('settings', {

    state: () => {
        return {
            hostUrl: '',
            lockedPreferences: [],
        }
    },

    getters: {
        isConfigured: (state) => state.hostUrl.length > 0,
    },

    actions: {

    },
})
