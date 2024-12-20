const en = {
    message: {
        reveal_password: 'Reveal password',
        has_lower_case: 'Has lower case',
        has_upper_case: 'Has upper case',
        has_special_char: 'Has special char',
        has_number: 'Has number',
        is_long_enough: '8 characters min.',
        mandatory_rules: 'Mandatory',
        optional_rules_you_should_follow: 'Recommanded (highly)',
        caps_lock_is_on: 'Caps lock is On',
        indecipherable: '*indecipherable*',
        no_service: '- no service -',
        search: 'Search',
        clear_search: 'Clear search',
        show_group_selector: 'Show group selector',
        hide_group_selector: 'Hide group selector',
        select_accounts_to_show: 'Select accounts group to show',
        all: 'All',
        error_occured: 'An error occured:',
        resource_not_found: 'Resource not found',
        generating_otp: 'Generating OTP',
        fetching_data: 'Fetching data...',
        copy_to_clipboard: 'Copy to clipboard',
        copied_to_clipboard: 'Copied to clipboard',
        counter: 'Counter',
        close_the_x_page: 'Close the :pagetitle page',
        back: 'Back',
        cancel: 'Cancel',
        close: 'Close',
        configure: 'Configure',
        bind_2fauth_to_use_extension: 'The perfect companion to your 2FAuth web application',
        twofauth_teaser: '2FAuth is a web app to manage your Two-Factor Authentication (2FA) accounts and generate their security codes',
        resources: 'Resources',
        credits: 'Credits',
        made_with: 'Made with',
        ui_icons_by: 'UI Icons by',
        twofauth_doc: '2FAuth documentation',
        how_to_create_a_pat: 'How to create a PAT',
        purpose_description: 'This web extension is an add-on to the 2FAuth webapp. It lets you access the 2FA data of your 2FAuth user account and generate OTPs directly from your browser bar.',
        purpose_requirements: 'You must have and bind a 2FAuth user account to use this extension. This requires a Personal Access Token (PAT).',
        test: 'Test',
        hi_x_its_all_good: 'Hi {username}, it\'s all good',
        save: 'Save',
        submit: 'Submit',
        ext_setup: 'Ext. setup',
        options: 'Options',
        general: "General",
        setting_saved: "Setting saved",
        pair: 'by Pair',
        half: 'by Half',
        trio: 'by Trio',
        pair_label: '12 34 56',
        half_label: '1234 5678',
        trio_label: '123 456',
        pair_legend: 'Group digits two by two',
        half_legend: 'Split digits into two equals groups',
        trio_legend: 'Group digits three by three',
        some_translation_are_missing: 'Some translations are missing using the browser preferred language?',
        help_translate_2fauth: 'Help translate 2FAuth',
        light: 'Light',
        dark: 'Dark',
        automatic: 'Auto',
        groups: 'Groups',
        no_group: 'No group',
        active_group: 'Active group',
        security: 'Security',
        never: 'Never',
        on_otp_copy: 'On security code copy',
        one_minutes: 'After 1 minute',
        two_minutes: 'After 2 minutes',
        five_minutes: 'After 5 minutes',
        ten_minutes: 'After 10 minutes',
        fifteen_minutes: 'After 15 minutes',
        thirty_minutes: 'After 30 minutes',
        one_hour: 'After 1 hour',
        one_day: 'After 1 day',
        otp_generation_on_request: 'After a click/tap',
        otp_generation_on_request_legend: 'Alone, in its own view',
        otp_generation_on_request_title: 'Click an account to get a password in a dedicated view',
        otp_generation_on_home: 'Constantly',
        otp_generation_on_home_legend: 'All of them, on home',
        otp_generation_on_home_title: 'Show all passwords in the main view, without doing anything',
        import_this_account: 'Import this account',
        generate: 'Generate',
    },
    error: {
        cannot_create_otp_without_secret: 'Cannot create an OTP without a secret',
        not_a_supported_otp_type: 'This OTP format is not currently supported',
    },
    field: {
        hostUrl: {
            label: '2FAuth URL',
            help: 'The web address of the 2FAuth instance where you signed up. For example: https://2fauth.mysite.me'
        },
        apiToken: {
            label: 'API token',
            help: 'Your Personal Access Token. You can generate one from the Settings > OAuth page of your 2FAuth user account'
        },
        extPassword: {
            label: 'Password',
            help: 'The password that will be used to lock this extension and encrypt sensitive data when needed'
        },
        password_format: {
            label: 'Password formatting',
            help: 'Change how the passwords are displayed by grouping digits to ease readability and memorization'
        },
        clear_search_on_copy: {
            label: 'Clear Search on copy',
            help: 'Empty the Search box right after a code has been copied to the clipboard'
        },
        sort_case_sensitive: {
            label: 'Sort case sensitive',
            help: 'When invoked, force the Sort function to sort accounts on a case-sensitive basis'
        },
        show_accounts_icons: {
            label: 'Show icons',
            help: 'Show account icons in the main view'
        },
        language: {
            label: 'Language',
            help: 'Language used to translate the extension interface. Named languages are complete, set the one of your choice to override your browser preference.'
        },
        theme: {
            label: 'Theme',
            help: 'Force a specific theme or apply the theme defined in your system/browser preferences'
        },
        default_group: {
            label: 'Default group',
            help: 'The group to which the newly created accounts are associated',
        },
        remember_active_group: {
            label: 'Remember group filter',
            help: 'Save the last group filter applied and restore it on your next visit',
        },
        view_default_group_on_copy: {
            label: 'View default group on copy',
            help: 'Always return to the default group when an OTP is copied',
        },
        auto_lock: {
            label: 'Auto lock',
            help: 'Log out the user automatically in case of inactivity. Has no effect when authentication is handled by a proxy and no custom logout url is specified.'
        },
        otp_generation: {
            label: 'Show Password',
            help: 'Set how and when OTPs are displayed.',
        },
        close_otp_on_copy: {
            label: 'Close OTP after copy',
            help: 'Click on a generated password to copy it automatically hides it from the screen'
        },
        auto_close_timeout: {
            label: 'Auto close OTP',
            help: 'Automatically hide on-screen password after a timeout. This avoids unnecessary requests for fresh passwords if you forget to close the password view.'
        },
        copy_otp_on_display: {
            label: 'Copy OTP on display',
            help: 'Automatically copy a generated password right after it appears on screen. Due to browsers limitations, only the first TOTP password will be copied, not the rotating ones'
        },
        show_otp_as_dot: {
            label: 'Show generated OTP as dot',
            help: 'Replace generated password caracters with *** to ensure confidentiality. Do not affect the copy/paste feature'
        },
        reveal_dotted_otp: {
            label: 'Reveal obscured OTP',
            help: 'Let the ability to temporarily reveal Dot-Obscured passwords'
        },
    },
    title: {
        popup: {
            twofauth: '2FAuth webext',
            setup: 'Setup',
            about: 'About',
            purpose: 'Purpose',
        }
    },
    link: {
        about: 'About',
        setup: 'Setup',
        landing: 'Landing',
        accounts: '2FAs',
        why_this: 'Why do I see this?',
        settings: 'Settings',
    },
    alt: {
        icon_to_illustrate_the_account: 'Icon that illustrates the account',
    },
    lang: {
        browser_preference: 'Browser preference',
        en: 'English (English)',
        fr: 'Français (French)',
        de: 'Deutsch (German)',
        es: 'Español (Spanish)',
        zh: '简体中文 (Chinese Simplified)',
        ru: 'Русский (Russian)',
        bg: 'Български (Bulgarian)',
        ja: '日本語 (Japanese)',
        hi: 'हिंदी (Hindi)',
        tr: 'Türkçe (Turkish)',
    }
}

export { en }