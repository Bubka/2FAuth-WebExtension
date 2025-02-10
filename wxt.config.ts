import { defineConfig } from 'wxt'
import { defineViteConfig as define } from './define.config.js'
// import vue from '@vitejs/plugin-vue'

// See https://wxt.dev/api/config.html
export default defineConfig({
    srcDir: 'src',
    outDir: 'dist',
    extensionApi: 'chrome',
    modules: [
        '@wxt-dev/module-vue'
    ],
    manifest: {
        name: '2FAuth (beta)',
        permissions: [
            'storage',
            'unlimitedStorage',
            'clipboardWrite',
            'alarms',
            'idle',
            'tabs',
            'background'
        ],
    },
    imports: {
        eslintrc: {
            enabled: 9,
        },
        addons: {
            vueDirectives: true,
        },
        imports: [
            { name: 'useNotification', from: '@kyvg/vue3-notification' },
            { name: 'onMessage', from: 'webext-bridge/background' },
            { name: 'sendMessage', from: 'webext-bridge/popup' },
        ],
        dirs: [
            './src/stores/**/*',
            './src/entrypoints/popup/composables/**/*',
            './src/entrypoints/popup/components/**/*',
            './src/entrypoints/popup/layouts/**/*',
            './src/entrypoints/popup/services/**/*',
            './src/entrypoints/popup/stores/**/*',
        ],
        presets: [
            // vue preset is automatically imported by @wxt-dev/module-vue
            'vue-router',
            'vue-i18n',
            'pinia',
            '@vueuse/core',
        ],
        
    },
    vite: () => ({
        // build: {
        //     emptyOutDir: true,
        //     sourcemap: false,
        // },
        plugins: [
            // vue(),
        ],
        define,
    }),
    alias: {
        '@popup': 'src/entrypoints/popup',
        '@public': 'src/public'
    }
})
