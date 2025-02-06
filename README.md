# 2FAuth-Browser-Extension

A web extension for retrieving 2FA codes generated by your 2FAuth server from your browser toolbar.

> [!NOTE]
> 2FAuth is a web app for managing your Two-Factor Authentication (2FA) accounts and generating their security codes.
>
> [2FAuth repository](https://github.com/Bubka/2FAuth) / [2FAuth docs](https://docs.2fauth.app/)

## Current features of the extension

- Bind your 2FAuth user account (using a Personal Access Token) and retreive your 2FA data and groups
- Retrieve user preferences on binding to avoid setting preferences from scratch (no synchronization afterwards)
- Get fresh TOTP & HOTP codes from your 2FAuth server
- Search in 2FA accounts & Browse groups
- Protect access to your 2FA data with an extension specific password

## Development

### Requirements

- [NodeJS](https://nodejs.com)
- [NPM](https://npmjs.com)

#### Install js dependencies

```shell
npm install
```

### Dev build

The extension uses the [Vite Plugin Web Extension](https://vite-plugin-web-extension.aklinker1.io/). It allows Hot Module Replacement (HMR) and a watch mode, cross-browser compatibility for the manifest file, automatic browser startup and more.

Simply run `npm run dev` in a terminal to launch a new browser and start coding/testing the extension.

### Distribution builds

```shell
# Build all distribution versions
npm run dist

# Build Chrome distribution version
npm run build:chrome

# Build Firefox distribution version
npm run build:firefox
```

## Contributing

You can contribute to 2FAuth and this web extension in many ways:

- By [reporting bugs](https://github.com/Bubka/2FAuth/issues/new?template=bug_report.md), or even better, by submitting a fix with a pull request on the *dev* branch.
- By [suggesting enhancement or new feature](https://github.com/Bubka/2FAuth/issues/new?template=feature_request.md). Please have a look to the [2FAuth development project](https://github.com/users/Bubka/projects/1), maybe your idea is already there.
- By correcting or completing translations in a language you speak, using the [Crowdin platform](https://crowdin.com/project/2fauth). Ask for your language if this one is lacking.

> [!IMPORTANT]
> Please do not open any issue or discussion in this repository, use the [2FAuth repository](https://github.com/Bubka/2FAuth/).

## License

[AGPL-3.0](https://www.gnu.org/licenses/agpl-3.0.html)
