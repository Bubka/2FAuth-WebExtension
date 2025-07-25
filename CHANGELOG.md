# Change log

## [1.1.2] - 2025-07-04

### Changed

- The extension is now built using the brand new [2FAuth component libraries](https://github.com/Bubka/2FAuth-Components). These libraries contain the common front-end components used by the web extension and web app.
- Requests receiving a 401 unauthorized response from the server now push the user to a dedicated view (instead of displaying a notification) with the ability to reset the extension from this view. This should eliminate the need to uninstall and reinstall the extension when locked out due to an invalid token.
- The error view now displays the reason why an error has occured (when available)

### Fixed

- The 'All' group label does not update dynamically when browser language changes
- Blank popup right after extension reset

## [1.1.1] - 2025-04-09

### Fixed

- Possible lock-out if something goes wrong when the setup form is submitted
- The banner informing about preferences being managed by the administrator is no longer visible if locked preferences are not used in the extension.

## [1.1.0] - 2025-04-07

### Added

- A user preference to enable precalculation and display of the next OTP code. __Requires 2FAuth `v5.5.0`__  
  Don't be surprised if you don't see the next code right after enabling this option, the code fades in slowly in order to maintain good readability of the current code.
- The extension now starts searching as soon as the user starts typing, without having to explicitly give focus to the search field

### Changed

- The user preferences enforced by the server administrator are now applied. __Requires 2FAuth `v5.5.0`__

### Fixed

- [issue #453](https://github.com/Bubka/2FAuth/issues/453), [issue #459](https://github.com/Bubka/2FAuth/issues/459) Various errors that caused the extension to remain locked

## [1.0.2] - 2025-02-14

### Changed

- The `tabs` extension permission in no longer requested

## [1.0.1] - 2025-02-13

### Fixed

- Popup icon not matching the system color scheme

## [1.0.0] - 2025-02-04

First release
