RestoFlow is a native restaurant ordering and billing demo implemented from the supplied `restoflow_ui_complete.zip`. It includes owner and waiter flows, restaurant setup, table management, separate customer orders and bills, menu search, language settings, waiter management, native receipt printing and subscription states.

## Try the demo

Use these numbers on the welcome screen:

| Role             | Mobile number |
| ---------------- | ------------- |
| Restaurant owner | `9876543210`  |
| Waiter Ravi      | `9876543211`  |
| New restaurant   | `9876543212`  |

The owner reviews and prints bills, completes individual visits, manages available tables and adds waiters. Waiters add customers and create or edit their orders. Finishing one customer's visit leaves the other guests at that table active. Menu search and category filtering work for both roles.

Restaurant data is saved on the device. Signing out keeps tables, orders and the team. Registering a new restaurant replaces this device's demo restaurant, matching the supplied prototype. English and Marathi are bundled; additional languages use the configured API when mock mode is disabled.

Authentication and subscription activation are local demonstration flows. There is no OTP service, backend or payment collection. Receipt printing opens the device's real print service; the app asks you to check the printed receipt before finishing the visit.

## Design and code

The ZIP's prototype, screen previews, SVGs and tokens are the implementation reference, as requested. No screenshot is used as a screen asset. All supplied SVGs are preserved byte for byte and imported through the [SVG transformer](https://github.com/kristerkari/react-native-svg-transformer). Icons keep their native 24-unit geometry and are tinted at the call site. Android and iOS supply their own status and navigation bars.

SF Pro binaries were not included in the ZIP. iOS uses its system font, Android uses its system sans-serif, and the supplied Noto Sans Devanagari font is bundled on both platforms. Asset and font licenses are in `licenses/`.

`src/app` contains typed React Navigation stacks and the floating tab bar. `src/components` contains shared UI controls. Each feature owns its screens, components, types or hooks; order calculations, receipt generation and persistence are separate from JSX. Tokens are in `src/theme/tokens.ts` and the supplied rules are preserved in `design/implementation-rules.md`.

## Install and verify

```sh
npm ci --legacy-peer-deps
npx tsc --noEmit
npm run lint
npm test -- --runInBand
```

The legacy peer flag is needed because `react-native-print` declares a Windows peer dependency incompatible with this project's React Native version. Windows is not a target of this app. Its Android SDK is aligned with the app in `android/build.gradle`.

For iOS, install CocoaPods dependencies on macOS before running the app. Android verification can use an emulator or device. The tests cover independent guest totals and checkout, order edits, zero quantities, occupied-table protection, duplicate phone numbers, receipt escaping, trial calculations and role-specific settings.

Verification details are in [design/verification.md](design/verification.md).

## Run the app

Start Metro in one terminal:

```sh
npm start
```

With an Android emulator or device connected, run in a second terminal:

```sh
npm run android
```

`npm run android` selects the development flavor. It builds native libraries for the connected device’s architecture to keep development builds smaller and faster. If installation reports `INSTALL_FAILED_INSUFFICIENT_STORAGE`, check free space on the emulator or device; clearing disposable caches can help without deleting app data.

For iOS on macOS, run `npm run native:configure`, `bundle install`, then `bundle exec pod install` from `ios/`, and return to the project root for `npm run ios:dev`. Native iOS compilation has not been verified in this Linux workspace.

See React Native’s [environment setup guide](https://reactnative.dev/docs/set-up-your-environment) for the required Android or iOS toolchain.

## Localization

The application now uses i18next with bundled English and Marathi, runtime language
discovery through our Hono API, and offline resources in the existing AsyncStorage.
See [docs/LOCALIZATION.md](docs/LOCALIZATION.md) for catalog changes, language
configuration and verification. The production API origin remains a placeholder until configured. Both environments currently use explicit mock mode, which blocks backend requests.

## Application infrastructure

Axios, Redux Toolkit, native environment configuration, MMKV, BootSplash and Stallion are integrated. DEV and PROD use separate Android flavors, iOS schemes, application identities and native Stallion project IDs. Existing local demo authentication is preserved.

Use `npm run android:dev` / `npm run android:prod`, or on macOS `npm run ios:dev` / `npm run ios:prod`.

`yarn android:dev:release` builds and installs a standalone demo with the current `MOCK_API=true` configuration. It bundles JavaScript into the APK, runs without Metro, and disables backend requests and Stallion OTA. To build the APK without installing it, run `./gradlew app:assembleDevelopmentRelease` from `android/`; the output is `android/app/build/outputs/apk/development/release/app-development-release.apk`.

Production releases, iOS releases, development releases with `MOCK_API=false`, and OTA uploads require real environment configuration.

See [docs/INFRASTRUCTURE.md](docs/INFRASTRUCTURE.md) for exact versions, setup, native identities, signing, OTA publishing, rollout and rollback. [docs/INFRASTRUCTURE_VERIFICATION.md](docs/INFRASTRUCTURE_VERIFICATION.md) records completed checks, remaining checks, and the implementation file list.
