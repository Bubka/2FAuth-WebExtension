<script setup>
    import { useExtensionStore } from '@/stores/extensionStore'
    import { useNotifyStore } from '@popup/stores/notify'
    import { useTwofaccounts } from '@popup/stores/twofaccounts'
    import { useGroups } from '@popup/stores/groups'
    import { UseColorMode } from '@vueuse/components'
    import SearchBox from '@popup/components/SearchBox.vue'
    import GroupSwitch from '@popup/components/GroupSwitch.vue'
    import Spinner from '@popup/components/Spinner.vue'
    import OtpDisplay from '@popup/components/OtpDisplay.vue'

    const extensionStore = useExtensionStore()
    const notify = useNotifyStore()
    const { copy, copied } = useClipboard()
    const twofaccounts = useTwofaccounts()
    const groups = useGroups()
    const showGroupSwitch = ref(false)
    const showOtpInModal = ref(false)
    
    const otpDisplay = ref(null)
    const otpDisplayProps = ref({
        otp_type: '',
        account : '',
        service : '',
        icon : '',
    })

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
     function showOrCopy(account) {
        if (!extensionStore.getOtpOnRequest && account.otp_type.includes('totp')) {
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
            // if (user.preferences.kickUserAfter == -1) {
            //     user.logout({ kicked: true})
            // }
            if (extensionStore.preferences.clearSearchOnCopy) {
                twofaccounts.filter = ''
            }
            if (extensionStore.preferences.viewDefaultGroupOnCopy) {
                extensionStore.preferences.activeGroup = extensionStore.preferences.defaultGroup == -1
                ? extensionStore.preferences.activeGroup
                : extensionStore.preferences.defaultGroup
            }
            
            notify.success({ text: trans('commons.copied_to_clipboard') })
        }
    }

    /**
     * Gets a fresh OTP from backend and copies it
     */
    async function getAndCopyOTP(account) { // TODO: à activer
        // twofaccountService.getOtpById(account.id).then(response => {
        //     let otp = response.data
        //     copyToClipboard(otp.password)

        //     if (otp.otp_type == 'hotp') {
        //         let hotpToIncrement = accounts.value.find((acc) => acc.id == account.id)
                
        //         if (hotpToIncrement != undefined) {
        //             hotpToIncrement.counter = otp.counter
        //         }
        //     }
        // })
    }

    onMounted(async () => {
        twofaccounts.fetch().then(() => {
            // if (twofaccounts.backendWasNewer) {
            //     notify.info({ text: trans('commons.data_refreshed_to_reflect_server_changes'), duration: 10000 })
            // }
        })
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
                                    <FontAwesomeIcon v-if="showGroupSwitch" :icon="['fas', 'caret-up']" />
                                    <FontAwesomeIcon v-else :icon="['fas', 'caret-down']" />
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
        <!-- show accounts list -->
        <div class="container" v-if="showAccounts == true">
            <!-- accounts -->
            <div class="accounts">
                <span id="dv" class="columns is-multiline">
                    <div class="tfa-list column is-narrow" v-for="account in twofaccounts.filtered" :key="account.id">
                        <div class="tfa-container">
                            <div tabindex="0" class="tfa-cell tfa-content is-size-5" @click.exact="showOrCopy(account)" @keyup.enter="showOrCopy(account)" @click.ctrl="getAndCopyOTP(account)" role="button">  
                                <div class="tfa-text has-ellipsis">
                                    <img v-if="account.icon" role="presentation" class="tfa-icon" :src="'https://testing.2fauth.app/storage/icons/' + account.icon" alt="">
                                    <img v-else-if="account.icon == null" role="presentation" class="tfa-icon" :src="'https://testing.2fauth.app/storage/noicon.svg'" alt="">
                                    {{ account.service ? account.service : $t('message.no_service') }}<FontAwesomeIcon class="has-text-danger is-size-5 ml-2" v-if="account.account === $t('message.indecipherable')" :icon="['fas', 'exclamation-circle']" />
                                    <span class="has-ellipsis is-family-primary is-size-6 is-size-7-mobile has-text-grey ">{{ account.account }}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </span>
            </div>
            <VueFooter>
                <router-link id="lnkLanding" :to="{ name: 'landing' }" class="has-text-grey">
                {{ $t('link.landing') }}
            </router-link>
            </VueFooter>
        </div>
        <Spinner :isVisible="twofaccounts.isFetching && ! showAccounts"  :type="'fullscreen-overlay'" message="message.fetching_data" />
    </div>
    </UseColorMode>
</template>
