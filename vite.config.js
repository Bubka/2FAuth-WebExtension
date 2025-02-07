import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import webExtension, { readJsonFile } from 'vite-plugin-web-extension'
// import vueDevTools from 'vite-plugin-vue-devtools'
import { defineViteConfig as define } from './define.config'

// function generateManifest() {
//     const manifest = readJsonFile('manifest.json')
//     const pkg = readJsonFile('package.json')
//     return {
//         name: pkg.name,
//         description: pkg.description,
//         version: pkg.version,
//         ...manifest,
//     };
// }

// https://vitejs.dev/config/
export default defineConfig({
    build: {
        emptyOutDir: true,
        sourcemap: false,
        rollupOptions: {
            output: {
                sanitizeFileName: (name) => {
                    // Sanitizes file names generated during the build process:
                    return name
                    .replace(/\s+/g, '-') // Replaces spaces with dashes.
                    .replace(/[^a-zA-Z0-9_.-]/g, ''); // Removes all invalid characters.
                },
            },
        },
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
            manifest: () => {
                const pkg = readJsonFile('package.json')
                const template = readJsonFile('manifest.json')

                const manifest = {
                    ...template,
                    name: pkg.displayName,
                    description: pkg.description,
                    version: '0.0.0',
                    version_name: pkg.version,
                }

                const [semVer, major, minor, patch] = pkg.version.match(/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/) ?? [];
                
                if (semVer != null) {
                    manifest.version = [major, minor, patch].join('.')
                }
                
                return manifest
            },
            watchFilePaths: ['package.json', 'manifest.json'],
            browser: process.env.TARGET || "chrome",
        }),
        AutoImport({
            imports: [
                'vue',
                'vue-router',
                'pinia',
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
