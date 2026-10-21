# Mobile API integration

The mobile app uses the two Production Worker URLs supplied for its native
build environments:

| Build environment | API origin |
| --- | --- |
| Development | `https://restoflow-backend-dev.gauravbhoiofficial.workers.dev` |
| Production | `https://restoflow-backend.gauravbhoiofficial.workers.dev` |

The mappings are pinned in `config/environments.json` and validated against
`.env.development` and `.env.production`. Both build tooling and runtime
validation reject the other environment, local origins, arbitrary hosts, and
Preview URLs. Axios rejects absolute request URLs and origin overrides before
attaching credentials. Media and translation requests also enforce the selected
origin. Production has no development fallback. Native configuration selects
the environment even for release JavaScript bundles.

## Authentication and storage

The temporary OTP mock runs locally in the app, selected by `USE_MOCK_OTP` in
`src/config/auth.ts`. Sending/resending and code validation use
`src/services/auth/mockOtp.ts`; neither `/otp/request` nor `/otp/verify` is
called in mock mode. The local code is `123456`. No SMS is sent. The real OTP
implementations remain behind the disabled development branch for later use.

All other APIs remain real, including owner/restaurant completion, account
restoration, refresh, logout, tables, menu, staff, orders, bills, and subscriptions.
There are no local demo accounts, restaurant storage, or table mutations.
Registration posts the actual names and optional image to
`/api/v1/onboarding/owner/complete` with a local `dev-mock-onboarding:<phone>`
proof. The prepared backend accepts this proof only in development when
`DEV_MOCK_AUTH=true`, and still uses the existing real database transaction to
save the owner, restaurant, subscription, and session. The phone screen first
calls the real `POST /api/v1/auth/phone/check` with `{ phoneNumber }` in E.164
format. It returns `{ registered: true | false }` inside the success envelope;
the lookup sends no OTP and creates no session or restaurant.

For an existing phone, the app shows a local mock OTP and validates `123456`
locally, then calls `POST /api/v1/auth/login` with `{ phoneNumber }`. This DEV-only
API requires `DEV_MOCK_AUTH=true`, rechecks account access, and issues real
session tokens for the saved restaurant. It supports owners and active waiters.
Inactive accounts and session creation failures remain errors.

For a new phone, the app opens restaurant details, then shows and validates the
local mock OTP before calling restaurant completion. The returned session opens
the dashboard. A lookup failure keeps the phone screen; a failed registration
keeps the form and verified proof available for retry. Neither branch calls OTP
sending/verification APIs or services in mock mode. Production rejects mock
authentication.

| API | Purpose |
| --- | --- |
| `POST /api/v1/auth/phone/check` | Read whether the phone exists. |
| `POST /api/v1/auth/login` | Create a real DEV session after local mock OTP verification. |
| `POST /api/v1/onboarding/owner/complete` | Save the owner/restaurant and create its real session. |

This flow is deployed on the DEV Worker as version
`5136594c-e13d-4f27-9dc1-4b0685c56407`. Live acceptance verified a new-number
lookup, real restaurant registration, the lookup changing to registered, login
into the same restaurant, session restoration/refresh, dashboard reads, and
logout. No OTP endpoint was called. All temporary test records were removed.
TypeScript checks, 120 mobile tests, and 280 backend tests pass. ESLint has no
errors and three existing warnings.

With mocks disabled, login requests a purpose-bound OTP from the backend, then verifies the entered
six-digit code. Unknown accounts can register an owner through registration OTP
verification followed by multipart restaurant/profile completion. No phone is
prefilled and no local phone lookup signs a user in. Roles and restaurant IDs
come from the server's current account profile.

Access and refresh tokens are stored together in native Keychain/Keystore using
`react-native-keychain`, scoped to environment and API origin. Redux contains
only account and membership details. Preference stores contain no credentials.
Startup restores credentials and fetches `/auth/me`; a network failure offers
retry instead of creating a local account. Concurrent 401s share one refresh,
then retry once with the rotated token. Rejected refresh clears the session.
Logout calls the server and clears local credentials. Failed network requests
never create fabricated success responses.

The server must set `X-RestoFlow-Environment` on successful and failed API
responses. This has been added to the backend's shared request middleware.
The client rejects absent or mismatched values.

## Restaurant operations

RestaurantProvider loads the selected restaurant, subscription, paginated menu,
tables, dashboard totals, open customer orders, and (for owners) active waiters.
A new account sees the backend's actual empty floor/menu. Restaurant data lives
on the server; the former device restaurant cache and mutation reducer are
removed. Requests are cancelled when sessions change, and previous users'
data is not displayed to a new session. The floor reloads after mutations and
on foreground/periodic refresh.

Table creation/deletion, waiter creation/photo upload, order creation and edits,
and visit completion call the restaurant-scoped APIs. UUIDs identify resources;
table numbers are separate display values. Menu categories and dish images
come from server data; missing images use a generic visual placeholder.

Order editing preserves individual server item IDs and historical price
snapshots, including repeated dishes with different snapshots. Quantities use
the backend limits. Existing-order changes use the backend's separate item
endpoints; if part of an edit fails, the app reloads the order before further
editing. Newly created orders are written atomically by the backend. Drafts are
unsaved UI state until the server confirms the mutation.

Bills and receipts use `/orders/{id}/bill` totals and snapshot lines, retaining
exact decimal money. Printing opens the real device print service. Finishing
a visit waits for `/orders/{id}/close`; opening a print dialog alone does not
complete the visit.

## Subscription and localization

Subscription status and trial dates come from the backend's owner subscription.
The simulated purchase and local premium activation are removed. Since the
backend exposes no payment/purchase API, the access screen explains operator
activation and checks the server for the updated subscription. It does not
claim that a payment was taken or grant lifetime access locally.

English and Marathi are bundled UI resources, with new OTP/loading/subscription
messages translated in both catalogs. Translation discovery and additional
language downloads use the same selected API origin. Existing offline language
preferences remain supported; they do not substitute for restaurant data.
The backend catalog and mobile metadata must be synced when UI keys change.

## Build and backend prerequisites

Adding native secure storage requires rebuilding the mobile app. On macOS,
install CocoaPods again before building iOS. A JavaScript OTA update alone cannot
add this native module. Existing release signing and environment-specific
Stallion credentials remain required; the former mock release bypass is removed.

```sh
npm ci --legacy-peer-deps
npm run typecheck
npm run lint
npm test -- --runInBand
npm run test:infrastructure
npm run android:dev
```

The backend completion includes `drizzle/0003_customer_orders.sql`, the new
customer/dashboard contracts, and the global environment response header.
A read-only DEV schema check confirmed the customer-name column and nonempty
constraint are already present. The response-header/catalog changes were deployed to the DEV Worker after
explicit approval; the live contract checks below passed. Do not substitute Preview URLs or another environment
while preparing deployment. Production requires its own backend configuration,
real SMS provider, storage, migration, and release prerequisites.

Read-only checks on 14 October 2026 found the DEV health endpoint healthy, with
`environment=development`. Production `/api/v1/health` returned HTTP 500 with
`CONFIGURATION_ERROR` (application environment not configured). Before deployment, DEV health lacked the global environment header. The
approved deployment now returns the correct development header on health,
OpenAPI, translation, and protected-route error responses. Production still
returns the configuration error. These findings do not change either mobile
API origin.

Local verification covers OTP flows through mocked HTTP transport, secure
credential failure/revocation, single-flight refresh, exact server bill printing,
pagination past 100 records, restaurant access, and rejection of cross-environment
and Preview origins. These tests do not claim live SMS, payment, production,
or native device acceptance.

## Verification for this change

- TypeScript checks passed.
- 104 mobile tests passed across nine suites; seven infrastructure tests passed.
- ESLint passed with three existing warnings.
- Android Metro release bundling passed.
- Native Android `app:assembleDevelopmentDebug` passed for `arm64-v8a`, including
  the new secure credential module and environment validation.
- Native autolinking detects Keychain for Android and iOS. iOS compilation remains
  unverified in this Linux workspace.
- Backend TypeScript, catalog synchronization, and 226 tests passed.
- DEV database schema was checked read-only; no migration was applied by this
  mobile integration task.

The approved DEV deployment succeeded with version
`5df0905d-212d-485b-b063-044c66f940c0`. Live read-only checks passed for health,
OpenAPI, the matching English catalog version, and 401 account/restaurant
responses carrying the correct environment header. No business data was
written by these acceptance checks. Production configuration/deployment was
not changed; its exact health URL still returned HTTP 500 `CONFIGURATION_ERROR`.
