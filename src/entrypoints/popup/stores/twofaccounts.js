import { defineStore } from 'pinia'
import { useNotify } from '@2fauth/ui'
import { useErrorHandler } from '@2fauth/stores'
import { usePreferenceStore } from '@/stores/preferenceStore'
import twofaccountService from '@popup/services/twofaccountService'
import { asArray } from '@popup/composables/helpers'

export const useTwofaccounts = defineStore('twofaccounts', () => {

    const preferenceStore = usePreferenceStore()

    // STATE

    const items = ref([])
    // const selectedIds = ref([])
    const filter = ref('')
    const showFavoritesOnly = ref(false)
    const backendWasNewer = ref(false)
    const fetchedOn = ref(null)
    const isFetching = ref(false)

    // GETTERS

    const filtered = computed(() => {
        return items.value.filter(
            item => {
                let itemMatch = false

                // Group filters :
                // -1: group less items
                // -2: items shared by me
                // -3: items shared with me
                //  0: all items (no group filter)
                // >0: any concrete group

                // group less items
                if (parseInt(preferenceStore.activeGroup) == -1 && item.group_id == null) {
                    itemMatch = true
                }
                // items I share
                else if (parseInt(preferenceStore.activeGroup) == -2 && (item.is_shared == true || item.is_shared_with_all == true)) {
                    itemMatch = true
                }
                // items shared with me
                else if (parseInt(preferenceStore.activeGroup) == -3 && item.is_borrowed == true) {
                    itemMatch = true
                }
                else if (parseInt(preferenceStore.activeGroup) > 0 && item.group_id == parseInt(preferenceStore.activeGroup)) {
                    // no global filter but a group
                    itemMatch = true
                }
                else if (parseInt(preferenceStore.activeGroup) == 0) {
                    // All items are matching
                    itemMatch = true
                }

                if (filter.value.length > 0) {
                    itemMatch = itemMatch && (
                        (item.service ? item.service.toLowerCase().includes(filter.value.toLowerCase()) : false)
                        || item.account.toLowerCase().includes(filter.value.toLowerCase())
                    )
                }

                if (showFavoritesOnly.value) {
                    itemMatch = itemMatch && item.is_favorite == true
                }

                return itemMatch
            }
        )
    })

    /**
     * Lists unique periods used by twofaccounts in the collection
     * ex: The items collection has 3 accounts with a period of 30s and 5 accounts with a period of 40s
     *     => The method will return [30, 40]
     */
    const periods = computed(() => {
        return items.value.filter(account => account.otp_type == 'totp').map(function(item) {
            return { period: item.period, generated_at: item.otp?.generated_at }
        }).filter((value, index, self) => index === self.findIndex((t) => (
            t.period === value.period
        ))).sort()
    })

    const isEmpty = computed(() => items.value.length == 0)
    const count = computed(() => items.value.length)
    const filteredCount = computed(() => filtered.value.length)
    // const orderedIds = computed(() => items.value.map(a => a.id))
    // const selectedCount = computed(() => selectedIds.value.length)
    // const hasNoneSelected = computed(() => selectedIds.value.length)

    // ACTIONS

    function $reset() {
        items.value = []
        filter.value = ''
        showFavoritesOnly.value = false
        backendWasNewer.value = false
        fetchedOn.value = null
        isFetching.value = false
    }

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

            await twofaccountService.getAll(! preferenceStore.getOtpOnRequest).then(response => {
                const backendItems = asArray(response?.data)
                
                // Defines if the store was up-to-date with the backend
                if (force) {
                    backendWasNewer.value = backendItems.length !== items.value.length
                    
                    items.value.forEach((item) => {
                        let matchingBackendItem = backendItems.find(e => e.id === item.id)
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
                items.value = backendItems
            })
        }
        else backendWasNewer.value = false

        isFetching.value = false
    }
        
    /**
     * Gets the IDs of all accounts that match the given period
     * @param {*} period 
     * @returns {Array<Number>} IDs of matching accounts
     */
    function accountIdsWithPeriod(period) {
        return items.value.filter(a => a.period == period).map(item => item.id)
    }

    /**
     * Toggle the favorite status of an account
     */
    async function toggleIsFavorite(accountId) {
        const notify = useNotify()
        const errorHandler = useErrorHandler()
        const index = items.value.findIndex(acc => acc.id === parseInt(accountId))

        if (index > -1) {
            const is_favorite = ! items.value[index].is_favorite

            await twofaccountService.toggleFavorite(accountId, is_favorite, { returnError: true }).then(response => {
                items.value[index].is_favorite = is_favorite
            })
            .catch(error => {
                if( error.response.status < 500 ) {
                    notify.alert({ text: this.$i18n.global.t('error.failed_to_set_favorite_status') })
                }
                else {
                    errorHandler.show(error)
                }
            })
        }
        else {
            notify.alert({ text: this.$i18n.global.t('error.failed_to_set_favorite_status') })
        }
    }

    /**
     * Get a 2FA account by its ID
     */
    function getById(id) {
        return items.value.find(a => a.id == id)
    }
    
    return {
        // STATE
        items,
        // selectedIds,
        filter,
        showFavoritesOnly,
        backendWasNewer,
        fetchedOn,
        isFetching,

        // GETTERS
        filtered,
        periods,
        isEmpty,
        count,
        filteredCount,

        // ACTIONS
        $reset,
        fetch,
        accountIdsWithPeriod,
        toggleIsFavorite,
        getById,
    }
})
