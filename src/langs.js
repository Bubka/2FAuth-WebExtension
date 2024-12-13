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
        purpose_requirements: 'You must have and bind a 2FAuth user account to use this extension. This requires a Personal Access Token (PAT).,'
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
        why_this: 'Why do I see this?',
    }
}

export { en }