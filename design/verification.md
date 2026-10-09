# Implementation verification

Reference: the supplied ZIP’s interactive prototype, 49 state previews, tokens and SVGs. The user approved this reference in place of a Figma cloud link. Verification ran on 9 October 2026.

## Code and native build

- `npx tsc --noEmit`: passed.
- `npm run lint`: passed with no errors or warnings.
- `npm test -- --runInBand`: 13 tests passed across two suites.
- Android `./gradlew assembleDebug`: passed; APK installed and launched on the Pixel 7 Pro emulator.
- `git diff --check`: passed.
- All 32 supplied SVG assets are nonempty and byte-identical to the ZIP. Their inventory is in `asset-manifest.json`.

## Android interactions

| Flow | Verified behavior |
| --- | --- |
| Owner billing | Rahul’s independent bill totals ₹420; receipt preview opens the Android print service; completing his visit leaves Amit active. |
| Menu | Category filtering, search, empty results and scrolling through all six supplied illustrations. |
| Settings and team | Hindi navigation saving and English restoration; duplicate waiter numbers are rejected; Meera can be added. |
| Table management | Add a table, cancel removal, confirm removal and retain the occupied table. |
| Waiter ordering | Require a customer name, create Priya’s ₹300 order, edit it to ₹120 and preserve Amit’s order. |
| Unsaved orders | Android Back opens the confirmation; Keep editing retains the draft; Discard changes retains the saved order. |
| Role access | Waiters see ordering controls and omit team management, billing and subscription purchase screens. |
| Trial expiry | An expired fixture blocks owner and waiter use, including Android Back; only the owner can activate the local demo plan. |
| Subscription | Purchase, success and premium screens work; activation preserves existing tables, team and orders. |
| Persistence | A full process restart restores edited tables, customers, Meera and the premium plan. |
| Restaurant setup | Unknown number opens registration; blank details fail validation; successful setup starts an empty floor and team with a fresh 15-day trial; first-table and empty-customer views work. |
| Profile photo | The native Android photo picker opens and cancels back to registration. |

## Layout review

Dashboard, menu and settings were reviewed at 360, 390 and 430 dp phone widths. Smaller views retain scrolling for all dishes and table actions. The 360 dp review uses a fresh app launch after changing the emulator display.

A contact sheet of native Android screens is in [native-preview.png](native-preview.png).

## Scope

Authentication and subscription activation follow the supplied local prototype. No backend, OTP delivery or real payment provider is connected. Native printing was checked through the Android system print dialog; physical printer output was not tested.

The ZIP does not contain SF Pro binaries. iOS uses its system font, Android uses its system sans-serif, and both bundle the supplied Noto Sans Devanagari font. System bars are provided by the operating system. Dates and trial counters follow the current device clock.

iOS project resources and permissions are configured. iOS compilation and device behavior require macOS verification.
