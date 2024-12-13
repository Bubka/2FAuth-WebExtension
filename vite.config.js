import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import webExtension, { readJsonFile } from 'vite-plugin-web-extension'
// import vueDevTools from 'vite-plugin-vue-devtools'
import { defineViteConfig as define } from './define.config'

function generateManifest() {
    const manifest = readJsonFile('manifest.json')
    const pkg = readJsonFile('package.json')
    return {
        name: pkg.name,
        description: pkg.description,
        version: pkg.version,
        ...manifest,
    };
}

// https://vitejs.dev/config/
export default defineConfig({
    build: {
        emptyOutDir: true,
        sourcemap: true,
        // rollupOptions: {
        //     input: {
        //         // popup: 'src/popup/index.html',
        //         // setup: 'src/setup/index.html',
        //         // options: 'src/options/index.html',
        //     },
        // },
    },
    plugins: [
        vue(),
        // vueDevTools(),
        webExtension({
            manifest: generateManifest,
            watchFilePaths: ['package.json', 'manifest.json'],
            browser: process.env.TARGET || "chrome",
        }),
        AutoImport({
            imports: [
                'vue',
                'vue-router',
                '@vueuse/core',
                {
                    'webextension-polyfill': [['*', 'browser']],
                    '@kyvg/vue3-notification': [
                        'useNotification'
                    ],
                },
            ],
            dts: 'src/types/auto-imports.d.ts',
            dirs: ['src/composables/'],
            eslintrc: {
                enabled: true,
                filepath: 'src/types/.eslintrc-auto-import.json',
            },
        }),
    ],
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url)),
            '~': fileURLToPath(new URL('./src', import.meta.url)),
            '@popup': fileURLToPath(new URL('./src/popup', import.meta.url)),
            '@public': fileURLToPath(new URL('./public', import.meta.url))
        },
    },
    define,
})
