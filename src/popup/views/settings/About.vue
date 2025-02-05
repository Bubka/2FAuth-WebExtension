<script setup>
    import { UseColorMode } from '@vueuse/components'
    import { sendMessage } from 'webext-bridge/popup'
    import { openUrlInNewTab } from '@popup/composables/helpers'
    import SettingTabs from '@popup/layouts/SettingTabs.vue'

    const extensionVersion = ref('')
    const version = __VERSION__

    onMounted(async () => {
        extensionVersion.value = await sendMessage('GET_EXT_VERSION',{}, 'background')
    })
</script>

<template>
    <div>
        <SettingTabs activeTab="settings.about" />
        <div class="options-tabs">
            <UseColorMode v-slot="{ mode }"> 
                <div class="options-tabs">
                    <p class="block is-size-7">
                        <span class="is-size-5" :class="mode == 'dark' ? 'has-text-white':'has-text-black'">
                            <span >2FAuth</span> <span class="has-text-grey">web extension <span class="is-size-7">v{{ version }}</span></span>
                        </span>
                        <br />
                        {{ $t('message.twofauth_teaser')}}
                    </p>
                    <img class="about-logo" src="/src/logo.svg" alt="2FAuth logo" />
                    <p class="block">
                        ©Bubka <a class="is-size-7" @click="openUrlInNewTab('https://github.com/Bubka/2FAuth/blob/master/LICENSE')">AGPL-3.0 license</a>
                    </p>
                    <h2 class="title is-5 has-text-grey-light">
                        {{ $t('message.resources') }}
                    </h2>
                    <div class="buttons">
                        <a class="button is-small" :class="{'is-dark' : mode == 'dark'}" @click="openUrlInNewTab('https://github.com/Bubka/2FAuth')">
                            <span class="icon is-small">
                                <FontAwesomeIcon :icon="['fab', 'github-alt']" />
                            </span>
                            <span>Github</span>
                        </a>
                        <a class="button is-small" :class="{'is-dark' : mode == 'dark'}" @click="openUrlInNewTab('https://docs.2fauth.app/')">
                            <span class="icon is-small">
                                <FontAwesomeIcon :icon="['fas', 'book']" />
                            </span>
                            <span>Docs</span>
                        </a>
                        <a class="button is-small" :class="{'is-dark' : mode == 'dark'}" @click="openUrlInNewTab('https://demo.2fauth.app/')">
                            <span class="icon is-small">
                                <FontAwesomeIcon :icon="['fas', 'flask']" />
                            </span>
                            <span>Demo</span>
                        </a>
                    </div>
                    <h2 class="title is-5 has-text-grey-light">
                        {{ $t('message.credits') }}
                    </h2>
                    <ul class="is-size-7">
                        <li>{{ $t('message.made_with') }}&nbsp;<a @click="openUrlInNewTab('https://docs.2fauth.app/credits/')">Laravel, Bulma CSS, Vue.js and more</a></li>
                        <li>{{ $t('message.ui_icons_by') }}&nbsp;<a @click="openUrlInNewTab('https://fontawesome.com/')">Font Awesome</a>&nbsp;<a class="is-size-7" @click="openUrlInNewTab('https://fontawesome.com/license/free')">(CC BY 4.0, Fonts: SIL OFL 1.1, Code: MIT License)</a></li>
                    </ul>
                </div>
            </UseColorMode>
        </div>
        <VueFooter :showButtons="true">
            <ButtonBackCloseCancel :returnTo="{ name: 'accounts' }" action="close" />
        </VueFooter>
    </div>
</template>