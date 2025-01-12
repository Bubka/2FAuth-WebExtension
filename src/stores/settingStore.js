import { defineStore } from 'pinia'

export const useSettingStore = defineStore('settings', {

    state: () => {
        return {
            hostUrl: '',
            extPassword: '',
        }
    },

    getters: {

    },

    actions: {

    },
})
