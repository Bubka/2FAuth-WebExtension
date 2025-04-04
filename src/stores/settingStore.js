import { defineStore } from 'pinia'

export const useSettingStore = defineStore('settings', {

    state: () => {
        return {
            hostUrl: '',
            lockedPreferences: [],
        }
    },

    getters: {

    },

    actions: {

    },
})
