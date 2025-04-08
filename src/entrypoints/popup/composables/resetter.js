import { useSettingStore } from '@/stores/settingStore'
import { usePreferenceStore } from '@/stores/preferenceStore'
import { useTwofaccounts } from '@popup/stores/twofaccounts'
import { useGroups } from '@popup/stores/groups'
import router from '@popup/router'

export function useResetExtension() {
   
    useSettingStore().$reset()
    usePreferenceStore().$reset()
    useTwofaccounts().$reset()
    useGroups().$reset()

    sendMessage('RESET_EXT', { }, 'background').then(() => {
        router.push({ name: 'landing' })
    })
}