# 2FAuth-Browser-Extension

A web extension for retrieving 2FA codes generated by your 2FAuth server from your browser toolbar.  

> [!NOTE]
> 2FAuth is a web app for managing your Two-Factor Authentication (2FA) accounts and generating their security codes.

🔗 [2FAuth repository](https://github.com/Bubka/2FAuth)  
🔗 [2FAuth docs](https://docs.2fauth.app/)

## Current features of the extension

- Bind your 2FAuth user account (using a Personal Access Token) and retreive your 2FA data and groups
- Retrieve user preferences on binding to avoid setting preferences from scratch (no synchronization afterwards)
- Get fresh TOTP & HOTP codes from your 2FAuth server
- Search in 2FA accounts & Browse groups
- Protect access to your 2FA data with an extension specific password

## Installation

### From official stores

🔗 ~~Mozilla Add-On store~~ Not yet available  
🔗 ~~Chrome Extension store~~ Not yet available

### From Github releases

You can download installation resources for both Firefox and Chrome browsers (zip, xpi, crx) from the [release page](https://github.com/Bubka/2FAuth-WebExtension/releases).  
Once downloaded, open the extension manager of your browser and drop the downloaded file to install the extension.

## Development

### Requirements

- [NodeJS](https://nodejs.com) (v22 min.)
- [NPM](https://npmjs.com)

### Install js dependencies

```shell
npm install
```

### Dev env

The extension uses the [WXT](https://wxt.dev/) web extension framework.
It allows Hot Module Replacement (HMR), cross-browser compatibility for the manifest file, automatic browser startup and more.

Simply run `npm run dev` in a terminal to launch a new browser (default is Chrome) and start working on the extension code. See package.json `scripts` section for other available commands.

#### Custom browser binaries

You can specify the browser binaries to use when running `npm run dev`. Rename `web-ext.config.ts.template` to `web-ext.config.ts` and edit the file to suit your needs.

#### Enable vue devTools

The standalone [@vue/devtools](https://devtools.vuejs.org/) app comes as an npm dev dependency. Run `./node_modules/.bin/vue-devtools` in a terminal to start it. The app is configured to listen for the extension pop-up and automatically connect to it when it opens.

### Build commands

```shell
# Build Chrome distribution version
npm run build

# Build Firefox distribution version
npm run build:firefox
```

Build output dir is `/dist/`

## Contributing

> [!IMPORTANT]
> Please do not open any issue or discussion in this repository, use the [2FAuth repository](https://github.com/Bubka/2FAuth/).
>
You can contribute to 2FAuth and this web extension in many ways:

- By [reporting bugs](https://github.com/Bubka/2FAuth/issues/new?template=bug_report.md), or even better, by submitting a fix with a pull request.
- By [suggesting enhancement or new feature](https://github.com/Bubka/2FAuth/issues/new?template=feature_request.md). Please have a look to the [2FAuth development project](https://github.com/users/Bubka/projects/1), maybe your idea is already there.
- By correcting or completing translations in a language you speak, using the [Crowdin platform](https://crowdin.com/project/2fauth). Ask for your language if this one is lacking.

## Derivative work

This extension's service worker is a modified version of the one created by [@Josh Gaby](https://github.com/josh-gaby) for his [2FAuth browser extension](https://github.com/josh-gaby/2fauth-browser-extension).

## License

[AGPL-3.0](https://github.com/Bubka/2FAuth-WebExtension?tab=AGPL-3.0-1-ov-file#readme)
