import js from '@eslint/js'
import pluginVue from 'eslint-plugin-vue'
import globals from 'globals'
import AutoImportGlobals from './.eslintrc-auto-import.json' with { type: 'json' }

export default [
    {
        name: 'app/files-to-lint',
        files: ['**/*.{js,mjs,jsx,vue}']
    },

    {
        name: 'app/files-to-ignore',
        ignores: ['**/dist/**', '**/dist-ssr/**', '**/coverage/**', 'public'],
    },

    js.configs.recommended,
    ...pluginVue.configs['flat/essential'],

    {
        name: 'app/global-rules-disabling',
        rules: {
            'vue/multi-word-component-names': 'off',
            'no-unused-vars': 'off',
        },
        languageOptions: {
            globals: {
                ...globals.node,
                ...globals.browser,
                ...globals.worker,
                ...globals.webextensions,
                ...AutoImportGlobals.globals,
            }
        }
    }
]
