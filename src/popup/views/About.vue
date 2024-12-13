<script setup>
    import { UseColorMode } from '@vueuse/components'
    
    const version = __VERSION__
    const displayName = __DISPLAY_NAME__
    const gitURL = __GITHUB_URL__
    
</script>

<template>
    <UseColorMode v-slot="{ mode }"> 
        <div>
            <h1 class="title has-text-grey-dark" v-html="$t('title.popup.about')"></h1>
            <p class="">A web extension for 2FAuth</p>
            <p class="block is-size-7 ">v{{ version }}</p>
            <p class="block is-size-7">
                <span class="is-size-5" :class="mode == 'dark' ? 'has-text-white':'has-text-black'">2FAuth</span>
                <br />
                {{ $t('message.twofauth_teaser')}}
            </p>
            <img class="about-logo" src="@public/logo.svg" alt="2FAuth logo" />
            <p class="block">
                ©Bubka <a class="is-size-7" href="https://github.com/Bubka/2FAuth/blob/master/LICENSE">AGPL-3.0 license</a>
            </p>
            <h2 class="title is-5 has-text-grey-light">
                {{ $t('message.resources') }}
            </h2>
            <div class="buttons">
                <a class="button is-small" :class="{'is-dark' : mode == 'dark'}" href="https://github.com/Bubka/2FAuth" target="_blank">
                    <span class="icon is-small">
                        <FontAwesomeIcon :icon="['fab', 'github-alt']" />
                    </span>
                    <span>Github</span>
                </a>
                <a class="button is-small" :class="{'is-dark' : mode == 'dark'}" href="https://docs.2fauth.app/" target="_blank">
                    <span class="icon is-small">
                        <FontAwesomeIcon :icon="['fas', 'book']" />
                    </span>
                    <span>Docs</span>
                </a>
                <a class="button is-small" :class="{'is-dark' : mode == 'dark'}" href="https://demo.2fauth.app/" target="_blank">
                    <span class="icon is-small">
                        <FontAwesomeIcon :icon="['fas', 'flask']" />
                    </span>
                    <span>Demo</span>
                </a>
            </div>
            <h2 class="title is-5 has-text-grey-light">
                {{ $t('message.credits') }}
            </h2>
            <p class="block is-size-7">
                <ul>
                    <li>{{ $t('message.made_with') }}&nbsp;<a href="https://docs.2fauth.app/credits/">Laravel, Bulma CSS, Vue.js and more</a></li>
                    <li>{{ $t('message.ui_icons_by') }}&nbsp;<a href="https://fontawesome.com/">Font Awesome</a>&nbsp;<a class="is-size-7" href="https://fontawesome.com/license/free">(CC BY 4.0, Fonts: SIL OFL 1.1, Code: MIT License)</a></li>
                </ul>
            </p>
        </div>
    </UseColorMode>
    <VueFooter :showButtons="true">
        <ButtonBackCloseCancel :returnTo="{ name: 'landing' }" action="close" />
    </VueFooter>
</template>
