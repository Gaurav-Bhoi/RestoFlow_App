RestoFlow is a native restaurant ordering and billing app with owner and waiter flows, OTP authentication, restaurant setup, tables, customer orders, menu search, waiter management, language settings, and native receipt printing.

## Backend environments

| Native build | API origin |
| --- | --- |
| Development | `https://restoflow-backend-dev.gauravbhoiofficial.workers.dev` |
| Production | `https://restoflow-backend.gauravbhoiofficial.workers.dev` |

These exact origins are enforced in build tooling and at runtime. Production has no development fallback, and Preview URLs are rejected. Rebuild the native app after changing environment configuration.

Development uses local OTP mocks controlled by `USE_MOCK_OTP` in `src/config/auth.ts`. Enter **123456** when prompted. Sending, resending, and verifying the code make **no calls** to `/otp/request` or `/otp/verify`; no SMS is sent. Challenges expire after five minutes, and resending replaces the previous local challenge. There is no seeded demo account.

Continue validates the phone and calls the real `/api/v1/auth/phone/check` API. An **existing number** gets the local mock OTP, then `/api/v1/auth/login` signs the user into their saved restaurant. A **new number** opens restaurant details, gets the local mock OTP, then `/api/v1/onboarding/owner/complete` saves the owner/restaurant and opens the dashboard. Enter `123456` for either mock OTP. The app advances only after a successful API response; lookup and save failures stay on the current screen and can be retried.

Both paths are supported by the deployed DEV backend (`DEV_MOCK_AUTH=true`). Live verification checked a new phone, registered a real temporary restaurant, checked that the phone was now registered, and logged back into the same restaurant. Session refresh, dashboard reads, and logout passed without calling OTP endpoints; the temporary records were removed afterward. Sessions, tables, menu, staff, orders, bills, and subscriptions use real APIs and server data. Production uses real OTP endpoints. Subscription activation is checked against the server after operator activation; the backend does not expose a purchase/payment API.

See [the mobile API integration guide](docs/API_INTEGRATION.md) for flow details and backend migration/deployment prerequisites. The production Worker currently needs backend configuration; its health endpoint returns `CONFIGURATION_ERROR`.

## Design and code

The ZIP's prototype, screen previews, SVGs and tokens are the implementation reference, as requested. No screenshot is used as a screen asset. All supplied SVGs are preserved byte for byte and imported through the [SVG transformer](https://github.com/kristerkari/react-native-svg-transformer). Icons keep their native 24-unit geometry and are tinted at the call site. Android and iOS supply their own status and navigation bars.

SF Pro binaries were not included in the ZIP. iOS uses its system font, Android uses its system sans-serif, and the supplied Noto Sans Devanagari font is bundled on both platforms. Asset and font licenses are in `licenses/`.

`src/app` contains typed React Navigation stacks and the floating tab bar. `src/components` contains shared UI controls. Each feature owns its screens, components, types or hooks; API calls, order drafts, and receipt generation are separate from JSX. Tokens are in `src/theme/tokens.ts` and the supplied rules are preserved in `design/implementation-rules.md`.

## Install and verify

```sh
npm ci --legacy-peer-deps
npx tsc --noEmit
npm run lint
npm test -- --runInBand
```

The legacy peer flag is needed because `react-native-print` declares a Windows peer dependency incompatible with this project's React Native version. Windows is not a target of this app. Its Android SDK is aligned with the app in `android/build.gradle`.

For iOS, install CocoaPods dependencies on macOS before running the app. Android verification can use an emulator or device. The tests cover OTP login/registration, server-backed tables, role-specific settings, secure credentials, token rotation, API pagination, exact bill snapshots, receipt escaping, and environment isolation.

Verification details are in [design/verification.md](design/verification.md).

## Run the app

Start Metro in one terminal:

```sh
npm start
```

On Linux, this launcher removes inherited Snap GTK and schema paths (for example,
from VS Code's integrated terminal) so React Native DevTools uses the host desktop
runtime. If DevTools reports a missing `font-antialiasing` schema key, stop Metro
and restart it with `npm start`. Additional Metro options can be passed with
`npm start -- --reset-cache`.

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
configuration and verification. Translation requests use the same pinned Worker origin as business APIs.

## Application infrastructure

Axios, Redux Toolkit, native environment configuration, MMKV, BootSplash and Stallion are integrated. DEV and PROD use separate Android flavors, iOS schemes, application identities and native Stallion project IDs. Authentication uses backend-issued tokens and persisted server sessions; development can use the fixed OTP described above.

Use `npm run android:dev` / `npm run android:prod`, or on macOS `npm run ios:dev` / `npm run ios:prod`.

App icons use the supplied white cutlery mark: development builds have a red
background (`#B91C1C`), and production builds keep the original green (`#173F35`).
The source SVG is in `assets/app-icon/brand-mark.svg`. Run `npm run icons:generate`
to regenerate the committed iPhone/iPad icons, Android legacy PNGs, and adaptive
icons using BootSplash's existing Sharp dependency. Android themed icons follow
the user's wallpaper palette. Icon changes require a native rebuild and reinstall.

Release builds bundle JavaScript into the app and require real signing and environment-specific Stallion configuration. Adding secure credential storage requires a native rebuild; an OTA update alone is insufficient. On macOS, reinstall CocoaPods before building iOS.

See [docs/INFRASTRUCTURE.md](docs/INFRASTRUCTURE.md) for exact versions, setup, native identities, signing, OTA publishing, rollout and rollback. [docs/INFRASTRUCTURE_VERIFICATION.md](docs/INFRASTRUCTURE_VERIFICATION.md) records completed checks, remaining checks, and the implementation file list.
