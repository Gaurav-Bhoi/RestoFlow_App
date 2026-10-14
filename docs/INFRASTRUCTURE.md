# RestoFlow application infrastructure

This checkout has exactly two application environments. Both files currently have `MOCK_API=true`, backend requests are blocked, and native Stallion tokens are unset. Android development releases support standalone demos using the embedded JavaScript bundle with Stallion OTA disabled. Production releases, iOS releases, real-service development releases and OTA uploads refuse incomplete service configuration. Existing restaurant demo screens, local authentication, navigation and localization remain available.

## Project inspection

| Setting                            | Existing value retained                                                                 |
| ---------------------------------- | --------------------------------------------------------------------------------------- |
| React Native / React               | 0.87.1 / 19.2.3                                                                         |
| TypeScript / package manager       | TypeScript 6.0.3 / npm with package-lock.json                                           |
| Architecture / runtime             | New Architecture / Hermes                                                               |
| Android Gradle Plugin / Gradle     | 9.2.1 / 9.4.1                                                                           |
| Kotlin                             | Root setting 2.2.0; RN Gradle plugin resolves 2.2.10                                    |
| Android min / target / compile SDK | 24 / 36 / 37                                                                            |
| Android build tools / NDK          | 37.0.0 / 27.1.12297006                                                                  |
| Gradle daemon toolchain            | Java 25, requested by the existing daemon configuration                                 |
| iOS deployment target              | 15.1                                                                                    |
| Navigation                         | React Navigation 7, native stack and bottom tabs                                        |
| Existing state                     | Restaurant context/reducer and local session context                                    |
| Existing API                       | Hono translation API only, originally using fetch                                       |
| Existing authentication            | Phone-based local demo; no access token, refresh endpoint, or secure credential storage |
| Existing persistence               | AsyncStorage for restaurant data and localization                                       |
| Previous splash / OTA              | Template launch screen / none; no CodePush                                              |

No React Native upgrade was needed. Existing AsyncStorage and restaurant state are retained where they have separate responsibilities. Redux now owns the shared demo session; restaurant business logic stays in its existing provider.

## Exact installed versions

| Package                       | Version |
| ----------------------------- | ------- |
| axios                         | 1.20.0  |
| @reduxjs/toolkit              | 2.13.0  |
| react-redux                   | 9.3.0   |
| react-native-config           | 1.7.2   |
| react-native-mmkv             | 4.3.2   |
| react-native-nitro-modules    | 0.37.1  |
| react-native-bootsplash       | 7.3.4   |
| react-native-stallion         | 2.4.2   |
| stallion-cli (dev dependency) | 2.5.1   |

All required packages were accepted. Legacy Redux, redux-persist and react-native-splash-screen were not added. The existing `react-native-print` Windows peer conflict still requires `npm ci --legacy-peer-deps`. Stallion's missing Android namespace/buildConfig support is supplied in the root Gradle configuration for AGP 9. A scoped npm override uses figlet 1.11.3 within stallion-cli, fixing the CLI's vulnerable pinned 1.8.1 dependency without changing its APIs.

## Environment selection and identities

|                     | DEVELOPMENT                              | PRODUCTION                                     |
| ------------------- | ---------------------------------------- | ---------------------------------------------- |
| Env file            | .env.development                         | .env.production                                |
| APP_ENV             | development                              | production                                     |
| API origin          | Existing http://10.0.2.2:8787            | Literal `<PRODUCTION_BACKEND_URL>` placeholder |
| Display name        | RestoFlow Dev                            | RestoFlow                                      |
| Android ID          | com.restoflow.dev                        | com.restoflow                                  |
| iOS bundle ID       | org.reactjs.native.example.RestoFlow.dev | org.reactjs.native.example.RestoFlow           |
| iOS scheme          | RestoFlowDev                             | RestoFlowProd                                  |
| Stallion project    | restoflow-dev                            | restoflow                                      |
| Stallion project ID | 6aca897a03fc44c9897cf2b5                 | 6aca880b9f76d8bbbc714eef                       |

The original production IDs are preserved. The iOS production build setting retains its original `org.reactjs.native.example.$(PRODUCT_NAME:rfc1034identifier)` expression; its resolved value is shown above. `config/environments.json` holds the environment matrix used by Android and release tooling. The committed iOS configs mirror that matrix and are checked by infrastructure tests.

Android flavors set APP_ENV/API values per variant, even when multiple variants are built together. iOS uses four configurations on one target: `Debug-Development`, `Release-Development`, `Debug-Production`, `Release-Production`. Archive actions use the matching Release configuration. Podfile maps all four configurations and sets the pod's ENVFILE deterministically. No copying/renaming `.env` files or global `/tmp/envfile` is used; an obsolete `/tmp/envfile` causes iOS builds to fail.

`src/config/env.ts` is the sole react-native-config access point. Native startup validates app identity, APP_ENV and Stallion project. `__DEV__` controls development features/Metro, never the environment. DEV and PROD backend origins must differ. Real API origins must use HTTPS, with HTTP allowed only for explicit local DEV hosts. DEV Release has a network security config allowing those local hosts. Production releases do not enable cleartext networking.

## Commands

```sh
npm ci --legacy-peer-deps
npm start
npm run android:dev
npm run android:prod
npm run android:dev:release
npm run android:prod:release

# On macOS, first configure native tokens and install pods:
npm run native:configure
bundle install
cd ios
bundle exec pod install
cd ..
npm run ios:dev
npm run ios:prod
npm run ios:dev:release
npm run ios:prod:release

npm run env:check -- development
npm run env:check -- production
npm run typecheck
npm run lint
npm test -- --runInBand
npm run test:infrastructure
```

CLI 20.2.0 uses `--mode` and iOS `--scheme`; these scripts use the installed CLI's supported flags. Android task discovery confirmed developmentDebug, developmentRelease, productionDebug and productionRelease, plus the RN template's developmentDebugOptimized/productionDebugOptimized variants. All Debug variants use Metro; Release variants load embedded or Stallion-managed bundles.

With `MOCK_API=true`, `yarn android:dev:release` builds and installs a standalone demo without Metro, backend access or Stallion OTA. No Stallion token is required for this demo. To build without a connected device, run `./gradlew app:assembleDevelopmentRelease` from `android/`. The APK is written to `android/app/build/outputs/apk/development/release/app-development-release.apk`. Android validation attaches to each flavor's BuildConfig and JavaScript bundle tasks because AGP can share native CMake/preBuild tasks between flavors.

For iOS archives after configuring the real environment and signing team:

```sh
xcodebuild -workspace ios/RestoFlow.xcworkspace -scheme RestoFlowDev \
  -configuration Release-Development -destination 'generic/platform=iOS' \
  -archivePath build/RestoFlowDev.xcarchive archive
xcodebuild -workspace ios/RestoFlow.xcworkspace -scheme RestoFlowProd \
  -configuration Release-Production -destination 'generic/platform=iOS' \
  -archivePath build/RestoFlowProd.xcarchive archive
```

## Configure the real services later

1. Set the correct API origin in each env file and set `MOCK_API=false` for that environment. Keep PROD logging false. `npm run i18n:configure` remains available to update the same native env files using RESTOFLOW_DEV_API_URL/RESTOFLOW_PROD_API_URL.
2. Copy `.env.stallion.local.example` to ignored `.env.stallion.local`. Add each project's actual App Token and real console bucket upload path. The tokens were not supplied and are currently unconfigured. Do not substitute App Tokens for dedicated CLI/CI tokens.
3. Run `npm run native:configure` to generate the ignored iOS native-only settings. Android reads the ignored local file or the corresponding process variables at build time. Tokens never enter mobile env files or package scripts.
4. Configure bundle signing before any production release. Use different RSA keys per environment. Run the installed CLI's `generate-key-pair` command in isolated temporary working directories and move only the public PEM to `stallion/public/development.pem` or `stallion/public/production.pem`. Keep private keys in ignored `stallion/secrets/` or the CI secret store. Set the corresponding PUBLIC_KEY_PATH and PRIVATE_KEY entries in the local template. Production native builds require the public key; production uploads require the matching private key. The build embeds the SPKI base64 public body accepted by SDK 2.4.2's native verifiers, avoiding plist newline escaping.
5. Provide real production Android signing through RESTOFLOW_PROD_KEYSTORE, RESTOFLOW_PROD_STORE_PASSWORD, RESTOFLOW_PROD_KEY_ALIAS, RESTOFLOW_PROD_KEY_PASSWORD. DEV uses the existing debug keystore for internal binaries. Production releases never silently use that key. Configure the iOS development team/provisioning on macOS.
6. Rebuild native binaries and reinstall pods. This integration adds native dependencies and cannot itself be shipped as an OTA update.

Bundled mobile config is extractable. Never put backend secrets, private keys or CI tokens in react-native-config, app JS, Info.plist, or native resources. Runtime App Tokens are native client configuration; private signing and CLI/CI credentials remain separate.

## Application services

`src/api/client.ts` creates one primary Axios instance with the native base URL, a 15-second timeout, JSON headers, centralized optional Bearer injection and normalized errors. The current demo has no backend credentials; the token reader returns null until real auth explicitly registers a Keychain/Keystore reader. No refresh endpoint, retry queue or token persistence was invented. A 401 is returned once. The translation endpoints retain their existing 270-second timeout for language generation and now use this client. Tests inject a transport into the independent translation contract tests.

Requests reject absolute URLs and baseURL overrides before transport. Successful and failed HTTP responses require `X-RestoFlow-Environment` to match the binary. Logging is restricted to the HTTP method in DEV debug mode; URLs, bodies, query strings, response payloads, headers and credentials are never logged. AbortController signals are supported directly. The real backend must maintain the environment header and avoid redirects to another origin; real server ownership/isolation cannot be verified with mock URLs.

`src/store` exports configureStore, RootState, AppDispatch and typed hooks. The session slice owns sign-in/sign-out; SessionProvider preserves the existing screen API. Redux Provider wraps existing providers. Local input/modals remain local, restaurant logic remains in its existing provider, and the entire Redux store is not persisted. No server cache library existed, so none was added.

`src/services/storage/mmkv.ts` lazily creates one synchronous v4 MMKV instance named `restoflow.<native environment>`. The typed wrapper supports strings, booleans, numbers, JSON objects, contains/remove/clear. Restaurant data migrates from AsyncStorage; the old copy is deleted only after a successful MMKV write. Localization's existing async cache remains in AsyncStorage, scoped by native environment and API origin. No credentials or hardcoded encryption key are stored in MMKV. Highly sensitive session credentials must use Keychain/Keystore when backend authentication is implemented.

BootSplash uses the existing cutlery asset and paper background. Android initializes BootSplash before ReactActivity's onCreate; iOS customizes the root view with the generated storyboard. Startup restores local localization, initializes Redux's signed-out demo session and restores restaurant data before mounting navigation. Network language discovery runs afterward. Navigation onReady hides BootSplash; storage failures recover to demo data, localization failures recover to English, and splash transition failures retry without animation. No duration timer controls the splash.

Stallion uses flavor-specific Android resources and build-setting substitutions in one iOS Info.plist. Android getDefaultReactHost supplies Stallion's JS path only for non-mock releases; Swift uses StallionModule.getBundleURL outside DEBUG. The non-mock release root uses withStallion. JavaScript never chooses Stallion credentials/projects. Mock/Metro development does not initialize the OTA HOC.

## OTA upload and release workflow

Publishing requires a real bucket path copied from the console in the form organization/project/bucket. Paths are currently unset. One existing `main` bucket per project is sufficient if that matches your console; no organization or bucket has been invented or created.

First build and test an actual DEV Release APK and DEV iOS Release/internal/TestFlight binary. Record each tested binary's native baseline:

```sh
npm run native:record -- --env=development --platform=android \
  --app-version=1.0 --binary=android/app/build/outputs/apk/development/release/app-development-release.apk
npm run native:record -- --env=development --platform=ios \
  --app-version=1.0 --binary=build/RestoFlowDev.xcarchive/Products/Applications/RestoFlow.app
```

The baseline verifies app identity/version/release mode where available and checks the compatibility hash embedded in that binary. Native files, dependency lockfile, env values, runtime token and public key affect the hash. A stale binary cannot be recorded against newer sources. Native/dependency/config changes invalidate subsequent OTA uploads. Baselines are local ignored files; recording one does not claim device OTA acceptance.

Authenticate locally using `npx --no-install stallion login`. CLI login is stored by Stallion outside the project. CI may later use separate STALLION_DEV_CI_TOKEN/STALLION_PROD_CI_TOKEN secrets. No CI workflow is added.

```sh
npm run ota:dev:android -- --notes="Fix editable billing quantity validation" --app-version=1.0
npm run ota:dev:ios -- --notes="Fix editable billing quantity validation" --app-version=1.0

# After equivalent DEV OTA verification on Android AND iOS, and recording
# the actual PROD binaries with native:record for each platform:
npm run ota:prod:android -- --notes="Fix editable billing quantity validation" \
  --app-version=1.0 --confirm-production=restoflow --dev-verified
npm run ota:prod:ios -- --notes="Fix editable billing quantity validation" \
  --app-version=1.0 --confirm-production=restoflow --dev-verified
```

Add `--dry-run` for local validation without upload; it still requires complete configuration and a matching baseline. Scripts lock upload paths to the chosen project name/ID, require useful notes and an exact app version, and reject changed native baselines. Production also requires deliberate confirmation, reported DEV verification and matching signing keys. App Tokens are rejected as CI credentials, output is redacted, and no credentials are embedded in commands in package.json. This helper uploads only; promotion/distribution is a separate deliberate action in the console, targeted at the exact recorded native app version. Never directly promote a DEV bundle into PROD.

CLI 2.5.1 enables Hermes by default, matching the binary. `--sourcemap` optionally generates private source maps with kept artifacts for a future error-monitoring upload; no monitoring service currently exists. Artifacts are ignored and must not be publicly hosted. No alpha CLI commands are used.

After DEV upload, promote in **restoflow-dev**, target the installed native version, use 100% DEV rollout, foreground the app, allow download, then restart as required and verify a tiny JS-only change. Repeat on Android and iOS. Verify the production project stayed untouched.

Before PROD upload, confirm API origin, native identities, project ID and signing key in the actual PROD binary. Promote in **restoflow**, target its exact native version and use internal verification followed by an appropriate rollout such as 5% → 20% → 50% → 100%. Monitor adoption/crashes before increasing. Normal releases are non-mandatory.

Mandatory real isolation acceptance: with DEV installed, publish/promote a distinct PROD test release and confirm DEV does not download it; publish DEV and confirm DEV receives it. Verify the inverse with an internal PROD binary. Dashboard/project isolation and actual devices must be checked. These tests are deferred in this mocked setup; no live upload/promotion was performed.

### Recovery

In the affected project's **Releases** screen, edit the release and **pause** it to stop downloads by new users. **Unpause** resumes it; change rollout percentage there as adoption is reviewed. **Rollback** a faulty release to return affected apps to the previous stable bundle according to SDK lifecycle; rollback also pauses the bad release. Verify recovery on the same native version on both platforms. Keep the last known-good release and the embedded binary available. If the fault requires native code, ship a new store/internal binary.

### Changes requiring a new native binary

React Native/Hermes/native library updates, pods, Gradle dependencies, AndroidManifest or Info.plist changes, permissions, Kotlin/Swift/Objective-C changes, native resources/signing keys, and bundled react-native-config values require new native builds. OTA is for compatible JavaScript/assets. The initial foundation installation is a native change.

## Primary references

Integration was checked against the installed package source and [Stallion SDK installation](https://stalliontech.io/learn/docs/sdk/installation), [stable publishing flags](https://stalliontech.io/learn/docs/cli/usage-api-reference), [production rollout/recovery](https://stalliontech.io/learn/docs/sdk/production-usage), [react-native-config](https://github.com/react-native-config/react-native-config), [MMKV v4](https://github.com/margelo/react-native-mmkv/blob/main/docs/V4_UPGRADE_GUIDE.md), and [BootSplash](https://github.com/zoontek/react-native-bootsplash).
