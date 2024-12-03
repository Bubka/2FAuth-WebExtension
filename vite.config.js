import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import webExtension, { readJsonFile } from 'vite-plugin-web-extension'
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
    },
    plugins: [
        vue(),
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
            '@popup': fileURLToPath(new URL('./src/popup', import.meta.url))
        },
    },
    define,
})
