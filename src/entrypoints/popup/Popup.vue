<script setup>
    import { RouterView, useRoute } from 'vue-router'
    import { usePreferenceStore } from '@/stores/preferenceStore'
    import { useSettingStore } from '@/stores/settingStore'
    import { Kicker } from '@2fauth/ui'

    const preferenceStore = usePreferenceStore()
    const settingStore = useSettingStore()
    const route = useRoute()
    const router = useRouter()
    const kickUser = ref(null)
    const kickUserAfter = ref(null)
    const isProtectedRoute = ref(route.meta.watchedByKicker)

    watch(
        () => route.name,
        () => {
            isProtectedRoute.value = route.meta.watchedByKicker
        }
    )

    onBeforeMount(async () => {
        const { language } = useNavigatorLanguage()
        await preferenceStore.$persistedState.isReady()

        sendMessage('CHECK_LOCKED', { }, 'background').then(({locked}) => {
            if (! locked && settingStore.isConfigured) {
                preferenceStore.syncWithServer()
            }
        })
        
        kickUser.value = preferenceStore.kickUserAfter !== null && preferenceStore.kickUserAfter !== 'null'
        kickUserAfter.value = parseInt(preferenceStore.kickUserAfter)

        watch(
            () => preferenceStore.kickUserAfter,
            () => {
                kickUser.value = preferenceStore.kickUserAfter !== null && preferenceStore.kickUserAfter !== 'null'
                kickUserAfter.value = parseInt(preferenceStore.kickUserAfter)
            }
        )
        watch(language, () => {
            preferenceStore.applyLanguage()
        })

        preferenceStore.applyTheme()
        preferenceStore.applyLanguage()
        preferenceStore.resetGroupFilter()
    })

    // Locks the extension
    async function lockExtension() {
        await sendMessage('LOCK_EXTENSION', { }, 'background')
        
        router.push({ name: 'unlock' })
    }

</script>

<template>
    <notifications
        id="vueNotification"
        role="alert"
        width="100%"
        position="top"
        :duration="4000"
        :speed="0"
        :max="1"
        classes="notification notification-banner is-radiusless" />
    <main class="main-section">
        <RouterView />
    </main>
    <Kicker
        v-if="kickUser && kickUserAfter > 0 && isProtectedRoute"
        :kickAfter="kickUserAfter"
        @kicked="lockExtension"
    />
</template>