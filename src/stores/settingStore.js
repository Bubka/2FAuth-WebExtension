import { defineStore } from 'pinia'

export const useSettingStore = defineStore('settingStore', {

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
