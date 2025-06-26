import { defineStore } from 'pinia'
import { usePreferenceStore } from '@/stores/preferenceStore'
import groupService from '@popup/services/groupService'

export const useGroups = defineStore('groups', () => {

    const preferenceStore = usePreferenceStore()
    const { t } = useI18n()

    // STATE

    const items = ref([])
    const fetchedOn = ref(null)

    // GETTERS

    const current = computed(() => {
        const group = items.value.find(item => item.id === parseInt(preferenceStore.activeGroup))

        return group && preferenceStore.activeGroup != 0 ? group.name : null
    })

    const withoutTheAllGroup = computed(() => items.value.filter(item => item.id > 0))
    const theAllGroup = computed(() => items.value.find(item => item.id == 0))
    const isEmpty = computed(() => withoutTheAllGroup.value.length == 0)
    const count = computed(() => withoutTheAllGroup.value.length)

    // ACTIONS

    function $reset() {
        items.value = [];
        fetchedOn.value = null;
    }

    /**
     * Fetches the groups collection from the backend
     */
    async function fetch() {
        // We do not want to fetch fresh data multiple times in the same 2s timespan
        const age = Math.floor(Date.now() - fetchedOn.value)
        const isNotFresh = age > 2000

        if (isNotFresh) {
            fetchedOn.value = Date.now()

            await groupService.getAll().then(response => {
                items.value = response.data
            })
        }
    }

    return {
        // STATE
        items,
        fetchedOn,

        // GETTERS
        current,
        withoutTheAllGroup,
        theAllGroup,
        isEmpty,
        count,

        // ACTIONS
        $reset,
        fetch,
    }
})
