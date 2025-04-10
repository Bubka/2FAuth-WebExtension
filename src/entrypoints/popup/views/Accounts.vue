<script setup>
    import twofaccountService from '@popup/services/twofaccountService'
    import { usePreferenceStore } from '@/stores/preferenceStore'
    import { useSettingStore } from '@/stores/settingStore'
    import { useNotifyStore } from '@popup/stores/notify'
    import { useTwofaccounts } from '@popup/stores/twofaccounts'
    import { useGroups } from '@popup/stores/groups'
    import { UseColorMode } from '@vueuse/components'
    import { useDisplayablePassword } from '@popup/composables/helpers'
    import { LucideLoaderCircle, LucideEye, LucideEyeOff, LucideCircleAlert, LucideChevronsDownUp, LucideChevronsUpDown } from 'lucide-vue-next'
    import SearchBox from '@popup/components/SearchBox.vue'
    import GroupSwitch from '@popup/components/GroupSwitch.vue'
    import Spinner from '@popup/components/Spinner.vue'
    import OtpDisplay from '@popup/components/OtpDisplay.vue'
    import TotpLooper from '@popup/components/TotpLooper.vue'
    import Dots from '@popup/components/Dots.vue'

    const { t } = useI18n()
    const router = useRouter()
    const preferenceStore = usePreferenceStore()
    const settingStore = useSettingStore()
    const notify = useNotifyStore()
    const { copy, copied } = useClipboard()
    const twofaccounts = useTwofaccounts()
    const groups = useGroups()
    const showGroupSwitch = ref(false)
    const showOtpInModal = ref(false)
    const isRenewingOTPs = ref(false)
    const renewedPeriod = ref(null)
    const opacities = ref({})
    
    const otpDisplay = ref(null)
    const otpDisplayProps = ref({
        otp_type: '',
        account : '',
        service : '',
        icon : '',
    })
    const looperRefs = ref([])
    const dotsRefs = ref([])

    /**
     * Returns whether or not the accounts should be displayed
    */
    const showAccounts = computed(() => {
        return !twofaccounts.isEmpty && !showGroupSwitch.value
    })

    /**
     * Shows rotating OTP for the provided account
     */
     function showOTP(account) {
        // Data that should be displayed quickly by the OtpDisplay
        // component are passed using props.
        otpDisplayProps.value.otp_type = account.otp_type
        otpDisplayProps.value.service = account.service
        otpDisplayProps.value.account = account.account
        otpDisplayProps.value.icon = account.icon

        nextTick().then(() => {
            showOtpInModal.value = true
            otpDisplay.value.show(account.id);
        })
    }

    /**
     * Shows an OTP in a modal or directly copies it to the clipboard
     */
     async function showOrCopy(account) {
        if (!preferenceStore.getOtpOnRequest && account.otp_type.includes('totp')) {
            copyToClipboard(account.otp.password)
        }
        else {
            showOTP(account)
        }
    }

    /**
     * Copies a string to the clipboard
     */
     function copyToClipboard (password) {
        copy(password)

        if (copied) {
            if (preferenceStore.kickUserAfter == -1) {
                sendMessage('LOCK_EXTENSION', { }, 'background').then(() => {
                    router.push('unlock')
                })
            }
            if (preferenceStore.clearSearchOnCopy) {
                twofaccounts.filter = ''
            }
            if (preferenceStore.viewDefaultGroupOnCopy) {
                preferenceStore.activeGroup = preferenceStore.defaultGroup == -1
                ? preferenceStore.activeGroup
                : preferenceStore.defaultGroup
            }
            
            notify.success({ text: t('message.copied_to_clipboard') })
        }
    }

    /**
     * Gets a fresh OTP from backend and copies it
     */
    async function getAndCopyOTP(account) {
        twofaccountService.getOtpById(account.id).then(response => {
            let otp = response.data
            copyToClipboard(otp.password)

            if (otp.otp_type == 'hotp') {
                let hotpToIncrement = twofaccounts.items.find((acc) => acc.id == account.id)
                
                // TODO : à koi ça sert ?
                if (hotpToIncrement != undefined) {
                    hotpToIncrement.counter = otp.counter
                }
            }
        })
    }

    /**
     * Turns dots On for all dots components that match the provided period
     */
    function turnDotsOn(period, stepIndex) {
        dotsRefs.value
            .filter((dots) => dots.props.period == period || period == undefined)
            .forEach((dot) => {
                dot.turnOn(stepIndex)
        })

        // The is-opacity-* classes are defined from 0 to 10 only.
        // TODO: Make the opacity refiner support variable number of steps (not only 10, see step_count)
        opacities.value[period] = 'is-opacity-' + stepIndex
    }

    /**
     * Turns dots Off for all dots components that match the provided period
     */
    function turnDotsOff(period) {
        dotsRefs.value
            .filter((dots) => dots.props.period == period || period == undefined)
            .forEach((dot) => {
                dot.turnOff()
        })
    }

    /**
     * Updates "Always On" OTPs for all TOTP accounts and (re)starts loopers
     */
    async function updateTotps(period) {
        if (! settingStore.hasFeature_showNextOtp) {
            isRenewingOTPs.value = true
            turnDotsOff(period)
        }
        let fetchPromise

        if (period == undefined) {
            renewedPeriod.value = -1
            fetchPromise = twofaccountService.getAll(true)
        } else {
            renewedPeriod.value = period
            fetchPromise = twofaccountService.getByIds(twofaccounts.accountIdsWithPeriod(period).join(','), true)
        }
        
        if (settingStore.hasFeature_showNextOtp) {
            turnDotsOff(period)

            // We replace the current on screen passwords with the next_password to avoid having loaders.
            // The next_password will be confirmed with a new request to be synced with the backend no matter what.
            const totpAccountsWithNextPasswordInThePeriod = twofaccounts.items.filter((account) => account.otp_type === 'totp'&& account.period == period && account.otp.next_password)
            
            if (totpAccountsWithNextPasswordInThePeriod.length > 0) {
                totpAccountsWithNextPasswordInThePeriod.forEach((account) => {
                    const index = twofaccounts.items.findIndex(acc => acc.id === account.id)
                    if (twofaccounts.items[index].otp.next_password) {
                        twofaccounts.items[index].otp.password = twofaccounts.items[index].otp.next_password
                    }
                })
                turnDotsOn(period, 0)
            }
        }

        fetchPromise.then(response => {
            let generatedAt = 0

            // twofaccounts TOTP updates
            response.data.forEach((account) => {
                if (account.otp_type === 'totp') {
                    const index = twofaccounts.items.findIndex(acc => acc.id === account.id)
                    if (twofaccounts.items[index] == undefined) {
                        twofaccounts.items.push(account)
                    }
                    else twofaccounts.items[index].otp = account.otp
                    generatedAt = account.otp.generated_at
                }
            })

            // Loopers restart at new timestamp
            nextTick().then(() => {
                looperRefs.value.forEach((looper) => {
                    if (looper.props.period == period || period == undefined) {
                        looper.startLoop(generatedAt)
                    }
                })
            })
        })
        .finally(() => {
            if (! settingStore.hasFeature_showNextOtp) {
                isRenewingOTPs.value = false
            }
            renewedPeriod.value = null
        })
    }

    onMounted(async () => {
        // This SFC is reached only if the user has some twofaccounts (see the starter middleware).
        // This allows to display accounts without latency.
        //
        // We sync the store with the backend again to
        if (! preferenceStore.getOtpOnRequest) {
            updateTotps()
        }
        else {
            twofaccounts.fetch().then(() => {
                // if (twofaccounts.backendWasNewer) {
                //     notify.info({ text: trans('commons.data_refreshed_to_reflect_server_changes'), duration: 10000 })
                // }
                if (twofaccounts.isEmpty) {
                    router.push({ name: 'start'})
                }
            })
        }
        groups.fetch()
    })

</script>

<template>
    <UseColorMode v-slot="{ mode }">
    <div>
        <!-- group switch -->
        <GroupSwitch v-if="showGroupSwitch" v-model:showGroupSwitch="showGroupSwitch" v-model:groups="groups.items" />
        <!-- header -->
        <div class="header" v-if="showAccounts || showGroupSwitch">
            <div class="columns is-gapless is-mobile is-centered">
                <div class="column is-three-quarters-mobile">
                    <!-- search -->
                    <SearchBox v-model:keyword="twofaccounts.filter"/>
                    <!-- toolbar -->
                    <!-- <Toolbar v-if="bus.inManagementMode"
                        :selectedCount="twofaccounts.selectedCount"
                        @clear-selected="twofaccounts.selectNone()"
                        @select-all="twofaccounts.selectAll()"
                        @sort-asc="twofaccounts.sortAsc()"
                        @sort-desc="twofaccounts.sortDesc()">
                    </Toolbar> -->
                    <!-- group switch toggle -->
                    <div class="has-text-centered">
                        <div class="columns">
                            <!-- <div class="column" v-if="showGroupSwitch">
                                <button type="button" id="btnHideGroupSwitch" :title="$t('message.hide_group_selector')" tabindex="1" class="button is-text is-like-text" :class="{'has-text-grey' : mode != 'dark'}" @click.stop="showGroupSwitch = !showGroupSwitch">
                                    {{ $t('message.select_accounts_to_show') }}
                                </button>
                            </div> -->
                            <div class="column">
                                <button type="button" id="btnShowGroupSwitch" :title="$t('message.show_group_selector')" tabindex="1" class="button is-text is-like-text" :class="{'has-text-grey' : mode != 'dark'}" @click.stop="showGroupSwitch = !showGroupSwitch">
                                    {{ groups.current }} ({{ twofaccounts.filteredCount }})&nbsp;
                                     <LucideChevronsDownUp v-if="showGroupSwitch" />
                                     <LucideChevronsUpDown v-else />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <!-- otp modal -->
        <Modal v-model="showOtpInModal">
            <OtpDisplay
                ref="otpDisplay"
                v-bind="otpDisplayProps"
                @please-close-me="showOtpInModal = false"
                @please-clear-search="twofaccounts.filter = ''">
            </OtpDisplay>
        </Modal>
        <!-- totp loopers -->
        <span v-if="!preferenceStore.getOtpOnRequest">
            <TotpLooper
                v-for="period in twofaccounts.periods"
                :key="period.period"
                :autostart="false"
                :period="period.period"
                :generated_at="period.generated_at"
                v-on:loop-ended="updateTotps(period.period)"
                v-on:loop-started="turnDotsOn(period.period, $event)"
                v-on:stepped-up="turnDotsOn(period.period, $event)"
                ref="looperRefs"
            ></TotpLooper>
        </span>
        <!-- show accounts list -->
        <div class="container" v-if="showAccounts == true">
            <!-- accounts -->
            <div class="accounts">
                <span id="dv" class="columns is-multiline">
                    <div class="tfa-list column is-narrow" v-for="account in twofaccounts.filtered" :key="account.id">
                        <div class="tfa-container">
                            <div tabindex="0" class="tfa-cell tfa-content is-size-4" @click.exact="showOrCopy(account)" @keyup.enter="showOrCopy(account)" @click.ctrl="getAndCopyOTP(account)" role="button">  
                                <div class="tfa-text has-ellipsis">
                                    <img v-if="account.icon && preferenceStore.showAccountsIcons" role="presentation" class="tfa-icon" :src="settingStore.hostUrl + '/storage/icons/' + account.icon" alt="">
                                    <img v-else-if="account.icon == null && preferenceStore.showAccountsIcons" role="presentation" class="tfa-icon" :src="settingStore.hostUrl + '/storage/noicon.svg'" alt="">
                                    {{ account.service ? account.service : $t('message.no_service') }}
                                    <LucideCircleAlert class="has-text-danger ml-2" v-if="account.account === $t('message.indecipherable')" />
                                    <span class="is-block has-ellipsis is-family-primary is-size-6 is-size-7-mobile has-text-grey ">{{ account.account }}</span>
                                </div>
                            </div>
                            <transition name="popLater">
                                <div v-show="preferenceStore.getOtpOnRequest == false" class="has-text-right">
                                    <!-- POST SHOW-NEXT-OTP ( >= 2FAuth v5.5.0) -->
                                    <div v-if="settingStore.hasFeature_showNextOtp && account.otp != undefined">
                                        <div class="always-on-otp is-clickable has-nowrap has-text-grey is-size-5 ml-4" @click="copyToClipboard(account.otp.password)" @keyup.enter="copyToClipboard(account.otp.password)" :title="$t('message.copy_to_clipboard')">
                                            {{ useDisplayablePassword(account.otp.password, preferenceStore.showOtpAsDot && preferenceStore.revealDottedOTP && revealPassword == account.id) }}
                                        </div>
                                        <div class="has-nowrap" style="line-height: 0.9;">
                                            <span v-if="preferenceStore.showNextOtp" class="always-on-otp is-clickable has-nowrap has-text-grey is-size-7 mr-2" :class="opacities[account.period]" @click="copyToClipboard(account.otp.next_password)" @keyup.enter="copyToClipboard(account.otp.next_password)" :title="$t('message.copy_next_password')">
                                                {{ useDisplayablePassword(account.otp.next_password, preferenceStore.showOtpAsDot && preferenceStore.revealDottedOTP && revealPassword == account.id) }}
                                            </span>
                                            <Dots
                                                v-if="account.otp_type.includes('totp')"
                                                :class="'condensed is-inline-block'"
                                                ref="dotsRefs"
                                                :period="account.period" />
                                        </div>
                                    </div>
                                    <!-- PRE SHOW-NEXT-OTP ( < 2FAuth v5.5.0) -->
                                    <span v-else-if="account.otp != undefined">
                                        <span v-if="isRenewingOTPs == true && (renewedPeriod == -1 || renewedPeriod == account.period)" class="has-nowrap has-text-grey has-text-centered is-size-5">
                                            <LucideLoaderCircle class="spinning" />
                                        </span>
                                        <span v-else class="always-on-otp is-clickable has-nowrap has-text-grey is-size-5 ml-4" @click="copyToClipboard(account.otp.password)" @keyup.enter="copyToClipboard(account.otp.password)" :title="$t('message.copy_to_clipboard')">
                                            {{ useDisplayablePassword(account.otp.password, preferenceStore.showOtpAsDot && preferenceStore.revealDottedOTP && revealPassword == account.id) }}
                                        </span>
                                        <Dots
                                            v-if="account.otp_type.includes('totp')"
                                            :class="'condensed'"
                                            ref="dotsRefs"
                                            :period="account.period" />
                                    </span>
                                    <div v-else>
                                        <!-- get hotp button -->
                                        <button type="button" class="button tag" :class="mode == 'dark' ? 'is-dark' : 'is-white'" @click="showOTP(account)" :title="$t('message.import_this_account')">
                                            {{ $t('message.generate') }}
                                        </button>
                                    </div>
                                </div>
                            </transition>
                            <transition name="popLater" v-if="preferenceStore.showOtpAsDot && preferenceStore.revealDottedOTP">
                                <div v-show="preferenceStore.getOtpOnRequest == false" class="has-text-right">
                                    <button v-if="revealPassword == account.id" type="button" class="pr-0 button is-ghost has-text-grey-dark" @click.stop="revealPassword = null">
                                        <LucideEye class="lucide-icon" />
                                    </button>
                                    <button v-else type="button" class="pr-0 button is-ghost has-text-grey-dark" @click.stop="revealPassword = account.id">
                                        <LucideEyeOff />
                                    </button>
                                </div>
                            </transition>
                        </div>
                    </div>
                </span>
            </div>
            <VueFooter>
                <router-link id="lnkLanding" :to="{ name: 'settings.options' }" class="has-text-grey">
                    {{ $t('link.settings') }}
                </router-link>
            </VueFooter>
        </div>
        <Spinner :isVisible="!showAccounts && !showGroupSwitch"  :type="'fullscreen-overlay'" message="message.fetching_data" />
    </div>
    </UseColorMode>
</template>
