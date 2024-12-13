import { defineStore } from 'pinia'
import { useExtensionStore } from '@/stores/extensionStore'
import twofaccountService from '@popup/services/twofaccountService'

export const useTwofaccounts = defineStore('twofaccounts', () => {

    const extensionStore = useExtensionStore()

    // STATE

    const items = ref([])
    // const selectedIds = ref([])
    const filter = ref('')
    const backendWasNewer = ref(false)
    const fetchedOn = ref(null)
    const isFetching = ref(false)

    // GETTERS

    const filtered = computed(() => {
        return items.value.filter(
            item => {
                if (parseInt(extensionStore.activeGroup) > 0 ) {
                    return ((item.service ? item.service.toLowerCase().includes(filter.value.toLowerCase()) : false) ||
                        item.account.toLowerCase().includes(filter.value.toLowerCase())) &&
                        (item.group_id == parseInt(extensionStore.activeGroup))
                }
                else {
                    return ((item.service ? item.service.toLowerCase().includes(filter.value.toLowerCase()) : false) ||
                        item.account.toLowerCase().includes(filter.value.toLowerCase()))
                }
            }
        )
    })

    /**
     * Lists unique periods used by twofaccounts in the collection
     * ex: The items collection has 3 accounts with a period of 30s and 5 accounts with a period of 40s
     *     => The method will return [30, 40]
     */
    // const periods = computed(() => {
    //     return items.value.filter(account => account.otp_type == 'totp').map(function(item) {
    //         return { period: item.period, generated_at: item.otp?.generated_at }
    //     }).filter((value, index, self) => index === self.findIndex((t) => (
    //         t.period === value.period
    //     ))).sort()
    // })

    const isEmpty = computed(() => items.value.length == 0)
    const count = computed(() => items.value.length)
    const filteredCount = computed(() => filtered.value.length)
    // const orderedIds = computed(() => items.value.map(a => a.id))
    // const selectedCount = computed(() => selectedIds.value.length)
    // const hasNoneSelected = computed(() => selectedIds.value.length)

    // ACTIONS

    /**
     * Refreshes the accounts collection using the backend
     */
    async function fetch(force = false) {
        isFetching.value = true
        // We do not want to fetch fresh data multiple times in the same 2s timespan
        const age = Math.floor(Date.now() - fetchedOn.value)
        const isOutOfAge = age > 2000

        if (isOutOfAge || force) {
            fetchedOn.value = Date.now()

            await twofaccountService.getAll().then(response => {
                // Defines if the store was up-to-date with the backend
                if (force) {
                    backendWasNewer.value = response.data.length !== items.value.length
                    
                    items.value.forEach((item) => {
                        let matchingBackendItem = response.data.find(e => e.id === item.id)
                        if (matchingBackendItem == undefined) {
                            backendWasNewer.value = true
                            return;
                        }
                        for (const field in item) {
                            if (field !== 'otp' && item[field] != matchingBackendItem[field]) {
                                backendWasNewer.value = true
                                return;
                            }
                        }
                    })
                }

                // Updates the state
                items.value = response.data
            })
        }
        else backendWasNewer.value = false

        isFetching.value = false
    }
    
    return {
        // STATE
        items,
        // selectedIds,
        filter,
        backendWasNewer,
        fetchedOn,
        isFetching,

        // GETTERS
        filtered,
        // periods,
        isEmpty,
        count,
        filteredCount,

        // ACTIONS
        fetch
    }
})
