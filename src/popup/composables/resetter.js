import { useSettingStore } from '@/stores/settingStore'
import { usePreferenceStore } from '@/stores/preferenceStore'
import { useTwofaccounts } from '@popup/stores/twofaccounts'
import { useGroups } from '@popup/stores/groups'
import { sendMessage } from 'webext-bridge/popup'

export function useResetExtension() {
   
    useSettingStore().$reset()
    usePreferenceStore().$reset()
    useTwofaccounts().$reset()
    useGroups().$reset()

    sendMessage('RESET_EXT', { }, 'background').then(() => {
        useRouter().push({ name: 'landing' })
    })
}