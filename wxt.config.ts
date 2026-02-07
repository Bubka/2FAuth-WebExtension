import { defineConfig } from 'wxt'
import { defineViteConfig as define } from './define.config.js'
import vueI18n from '@intlify/unplugin-vue-i18n/vite'
// import vue from '@vitejs/plugin-vue'

// See https://wxt.dev/api/config.html
export default defineConfig({
    srcDir: 'src',
    outDir: 'dist',
    modules: [
        '@wxt-dev/module-vue'
    ],
    manifest: ({ browser, manifestVersion, mode, command }) => {
        const permissions = [
            'storage',
            'unlimitedStorage',
            'clipboardWrite',
            'alarms',
            'idle',
            'activeTab',
            'scripting',
            'tabs',
            'notifications',
        ]

        if (browser === 'chrome' || browser === 'edge' ) {
            permissions.push('background')
            permissions.push('offscreen')
        }

        const action = {
            default_popup: 'src/entrypoints/popup/index.html',
            default_title: '2FAuth',
            default_icon: {
                16: 'icon-16.png',
                32: 'icon-32.png',
                64: 'icon-64.png',
            },
        }

        const manifest = {
            name: '__MSG_extName__',
            description: '__MSG_extDescription__',
            permissions: permissions,
            default_locale: 'en',
            icons: {
                16: 'icon-16.png',
                32: 'icon-32.png',
                48: 'icon-48.png',
                96: 'icon-96.png',
                128: 'icon-128.png',
            },
            action: action,
        }

        return manifest
    },
    imports: {
        eslintrc: {
            enabled: 9,
        },
        addons: {
            // vueTemplate automatically set to true by @wxt-dev/module-vue
            vueDirectives: true,
        },
        imports: [
            { name: 'useNotification', from: '@kyvg/vue3-notification' },
            { name: 'onMessage', from: 'webext-bridge/background' },
            { name: 'sendMessage', from: 'webext-bridge/popup' },
        ],
        // dirs: [
        // ],
        presets: [
            // vue preset is automatically imported by @wxt-dev/module-vue
            // vue-i18n preset is automatically imported by @wxt-dev/i18n
            'vue-router',
            'pinia',
            '@vueuse/core',
        ],
        
    },
    vite: () => ({
        build: {
            // emptyOutDir: true,
            // sourcemap: 'development' === process.env.NODE_ENV,
            // sourcemap: true
        },
        plugins: [
            // vue(),
            vueI18n({
                // include: 'src/assets/locales/*.json',
                include: [
                    'resources/lang/en.json',
                    'resources/lang/fr.json',
                ]
            }),
        ],
        define,
        resolve: {
            dedupe: [
                'pinia',
                '@kyvg/vue3-notification',
            ],
        },
    }),
    alias: {
        '@popup': 'src/entrypoints/popup',
        '@public': 'src/public'
    }
})
