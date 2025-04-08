import { defineStore } from 'pinia'

export const useSettingStore = defineStore('settings', {

    state: () => {
        return {
            hostUrl: '',

            // Used only if the server runs 2FAuth v5.5.0 or higher
            hasLockedPreferences: false, 
            lockedPreferences: [], 
        }
    },

    getters: {
        isConfigured: (state) => state.hostUrl.length > 0,

        // The showNextOtp preference has been introduced in 2FAuth v5.5.0, the version that also introduced the preference locking feature.
        // For now there is no way to identify the 2FAuth version ran by the server so we evaluate the presence of
        // locked preference to determine the availability of the showNextOtp feature on server side.
        //
        // TODO: Find a way to identify 2FAuth version running on server side
        hasFeature_showNextOtp: (state) => state.hasLockedPreferences,
    },

    actions: {

    },
})
