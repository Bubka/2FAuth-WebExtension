import { defineStore } from 'pinia'
import featureFlagService from '@popup/services/featureFlagService'
import { asArray } from '@popup/composables/helpers'

export const useSettingStore = defineStore('settings', () => {

    // STATE

    const hostUrl = ref('')

    // Used only if the server runs 2FAuth v5.5.0 or higher
    const hasLockedPreferences = ref(false)
    const lockedPreferences = ref([])
    const featureFlags = ref([])

    // GETTERS

    const isConfigured = computed(() => hostUrl.value.length > 0)
    const hasFeature_showNextOtp = computed(() => hasLockedPreferences.value)
    const hasFeature_iconPack = computed(() => hasFeature('iconPack'))

    // ACTIONS

    function $reset() {
        hostUrl.value = '';
        hasLockedPreferences.value = false;
        lockedPreferences.value = [];
    }

    function fetchFeatureFlags()
    {
        featureFlagService.getAll({returnError: true}).then((response) => {
            // Until 2FAuth v6.1, the API returns the laravel landing view
            // html code when the requested endpoint does not exist.
            if (String(response.data).startsWith('<!DOCTYPE'))
            {
                return
            }

            featureFlags.value = []
            
            asArray(response?.data).forEach(featureFlag => {
                featureFlags.value.push(featureFlag)
            })
        })
        .catch((error) => {
            // Since 2FAuth v6.1 we receive a 404 response
        })
    }

    // NOT EXPOSED

    /**
     * 
     * @param {string} featureName 
     * @returns 
     */
    function hasFeature(name)
    {
        return name && featureFlags.value.find(feature => feature.name == name && feature.state == 'enabled') != undefined
    }


    return {
        // STATE
        hostUrl,
        hasLockedPreferences,
        lockedPreferences,
        featureFlags,

        // GETTERS
        isConfigured,
        hasFeature_showNextOtp,
        hasFeature_iconPack,

        // ACTIONS
        $reset,
        fetchFeatureFlags,
    }
})
