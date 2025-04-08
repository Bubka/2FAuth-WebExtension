<script setup>
    import { UseColorMode } from '@vueuse/components'
    import { openUrlInNewTab } from '@popup/composables/helpers'
    import SettingTabs from '@popup/layouts/SettingTabs.vue'
    import { LucideGraduationCap, LucideFlaskConical } from 'lucide-vue-next';

    const extensionVersion = ref('')
    const version = __VERSION__

    onMounted(async () => {
        extensionVersion.value = await sendMessage('GET_EXT_VERSION',{}, 'background')
    })

    onBeforeRouteLeave((to) => {
        if (! to.name.startsWith('settings.')) {
            notify.clear()
        }
    })
    
</script>

<template>
    <div>
        <SettingTabs activeTab="settings.about" />
        <div class="options-tabs">
            <UseColorMode v-slot="{ mode }"> 
                <div class="options-tabs">
                    <!-- <h2 class="title is-5 ">
                        <span :class="mode == 'dark' ? 'has-text-white':'has-text-black'">2FAuth</span>
                        <span class="has-text-grey">web extension <span class="is-size-7">v{{ version }}</span></span>
                    </h2> -->
                    <p class="block">
                        <span class="is-size-5 is-block mb-2" :class="mode == 'dark' ? 'has-text-white':'has-text-black'">
                            <span >2FAuth</span> <span class="has-text-grey">web extension <span class="is-size-7">v{{ version }}</span></span>
                        </span>
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
                        <a class="button" :class="{'is-dark' : mode == 'dark'}" @click="openUrlInNewTab('https://github.com/Bubka/2FAuth')">
                            <span class="icon">
                                <svg :fill="mode == 'dark' ? '#FFF' : '#181717' " role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" class="lucide mr-1">
                                    <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
                                </svg>
                            </span>
                            <span>2FAuth</span>
                        </a>
                        <a class="button" :class="{'is-dark' : mode == 'dark'}" @click="openUrlInNewTab('https://github.com/Bubka/2FAuth-WebExtension')">
                            <span class="icon">
                                <svg :fill="mode == 'dark' ? '#FFF' : '#181717' " role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" class="lucide mr-1">
                                    <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
                                </svg>
                            </span>
                            <span>Web extension</span>
                        </a>
                    </div>
                    <div class="buttons">
                        <a class="button" :class="{'is-dark' : mode == 'dark'}" @click="openUrlInNewTab('https://docs.2fauth.app/')">
                            <span class="icon">
                                <LucideGraduationCap class="mr-1" />
                            </span>
                            <span>Docs</span>
                        </a>
                        <a class="button" :class="{'is-dark' : mode == 'dark'}" @click="openUrlInNewTab('https://demo.2fauth.app/')">
                            <span class="icon">
                                <LucideFlaskConical class="mr-1" />
                            </span>
                            <span>Demo</span>
                        </a>
                    </div>
                    <h2 class="title is-5 has-text-grey-light">
                        {{ $t('message.credits') }}
                    </h2>
                    <ul class="is-size-7">
                        <li>{{ $t('message.made_with') }}&nbsp;<a @click="openUrlInNewTab('https://docs.2fauth.app/credits/')">Laravel, Bulma CSS, Vue.js and more</a></li>
                        <li>{{ $t('message.ui_icons_by') }}&nbsp;<a @click="openUrlInNewTab('https://lucide.dev/')">Lucide</a>&nbsp;<a class="is-size-7" @click="openUrlInNewTab('https://lucide.dev/license')">(ISC License)</a></li>
                    </ul>
                </div>
            </UseColorMode>
        </div>
        <VueFooter :showButtons="true">
            <ButtonBackCloseCancel :returnTo="{ name: 'accounts' }" action="close" />
        </VueFooter>
    </div>
</template>