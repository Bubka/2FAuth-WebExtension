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
        imports: [
            // { name: '=', as: 'browser', from: 'webextension-polyfill' },
            { name: 'useNotification', from: '@kyvg/vue3-notification' },
        ],
        dirs: [
            'src/entrypoints/stores/*',
            'src/entrypoints/popup/composables/*',
            'src/entrypoints/popup/components/*',
            'src/entrypoints/popup/layouts/*',
            'src/entrypoints/popup/services/*',
            'src/entrypoints/popup/stores/*',
        ],
        presets: [
            'vue',
            'vue-router',
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
