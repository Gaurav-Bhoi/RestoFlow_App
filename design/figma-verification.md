# Verified Figma implementation

Source: [RestoFlow_fixed_v2](https://www.figma.com/design/HHJohW6ijJ9rSb2ND7f6tM/RestoFlow_fixed_v2?node-id=1-2). Reviewed 11 October 2026.

## Scope and source evidence

The file structure was inspected across all five pages: overview, original screens, original components, additional Menu/Ledger/Billing flows, and added components. The inventory includes 49 original screen states, 351 additional frames, 25 original components and 89 added components.

Detailed design context and screenshots were retrieved for these three 390 × 844 frames before the Figma connection reached its Starter-plan tool limit:

| Screen          | Source node | Implemented behavior                                                                                       |
| --------------- | ----------- | ---------------------------------------------------------------------------------------------------------- |
| Login Owner     | `1:12`      | Phone entry, validation, sign-in and registration navigation.                                              |
| Registration    | `1:234`     | Optional native photo picker, restaurant/owner/phone inputs, validation, cancel/back and account creation. |
| Dashboard Empty | `1:307`     | Header/account navigation, floor metrics, first-table action, Manage and bottom tabs.                      |

The user explicitly chose to continue only with verified designs. Other screens retain their existing flows and benefit from shared components; they have not received a detailed cloud-Figma fidelity review. The new Menu/Ledger/Billing flows remain deferred.

## Measured design values

| Pattern         | Values from the verified frames                                                                                                                                    |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Colors          | Paper `#f6f5ef`, forest `#173f35`, ink `#22352d`, sage `#e5ece2`, muted `#5e6d63`, strong sage `#d5e3d4`, line `#e1e5dc`.                                          |
| Typography      | SF Pro Regular/400, zero letter spacing; header 25/35, section 21/29.4, body and buttons 14/21, labels 12/18, helpers 11/16.5.                                     |
| Screen          | 22 horizontal padding at reference width; 75 header height; 8 content top padding.                                                                                 |
| Inputs          | 54 minimum height, 17 radius, 9 label gap and 21 group spacing.                                                                                                    |
| Buttons         | 50 minimum height and 25 radius.                                                                                                                                   |
| Login           | Measured −4 horizontal welcome offset; 320 × 213 art container, 100 radius; original two-line headline spacing and reserved validation space.                      |
| Registration    | 80 photo control with 3 white border; 115 Cancel width, 10 footer action gap; 72.78125 minimum notice height.                                                      |
| Empty Dashboard | 99.5 summary height at default text size, 24 radius; 120 empty illustration circle with 48 SVG; 310 action width at reference size.                                |
| Bottom tabs     | 66 height, 18 outer horizontal inset, 33 radius, 5 padding, 3 tab gap; active tab width ratio 10:7 against each inactive tab; shadow `0 6 12 rgba(23,63,53,0.06)`. |

The native operating system supplies status/navigation bars and safe-area insets. Mock status icons, rounded screenshot corners and home indicators are not rendered as app UI. Fractional values preserve measured text-box geometry rather than compensating with device-specific offsets.

## Responsive behavior and shared components

`useResponsiveLayout` uses available width after safe-area insets. Forms center within a 520 maximum frame; other screens and navigation use a 600 maximum frame. Below 350 width, horizontal padding reduces to 16. Typography, controls and icons retain their measured sizes; the welcome artwork fits its container while preserving its aspect ratio.

`Screen` centralizes safe areas, scrolling, bottom-tab clearance, bounded footers and keyboard avoidance. It uses padding on iOS and height adjustment on Android, including edge-to-edge windows. `AppInput` identifies the focused field through a local context so its screen scrolls it above the keyboard and measured footer. Registration supports Next focus between fields, Done submission and keyboard dismissal after success. Single-line headers, buttons, metrics and tabs have explicit overflow behavior; paragraphs wrap naturally. Text scaling is bounded, and form fields can grow vertically.

Existing `AppHeader`, `AppText`, `AppInput`, `AppButton`, `PhotoPicker`, `Notice`, `Avatar`, `EmptyState`, `FloorSummary` and `FloatingTabBar` were reused and refined. `FigmaAsset` renders the exact exported SVGs. Centralized tokens preserve the existing colors, spacing and radii and add verified typography, control dimensions and responsive bounds.

## Assets, dependencies and fonts

Eleven SVG assets were exported from the verified frames. Their intrinsic dimensions, source frames and SHA-256 checksums are recorded in [figma-assets.json](figma-assets.json). The SVG files remain byte-identical to their exports. No package was added or upgraded.

Figma specifies SF Pro but provides no font binary. iOS uses its system font; Android uses native sans-serif, so glyph shapes and text widths differ from Figma. The existing bundled Devanagari font remains available. Exact cross-platform SF Pro parity is not claimed.

## Validation

- TypeScript: passed.
- ESLint: zero errors; three existing `no-void` warnings in localization/settings code.
- Jest: all 90 tests passed across six suites. The added onboarding test covers invalid registration, successful setup, the empty floor and adding the first table.
- Android: normal `assembleDevelopmentDebug` build passed for the emulator architecture. Native review uses a separate temporary package and matching temporary identity check; project environment and authentication code remain unchanged.
- iOS: production JavaScript bundle and asset compilation passed. Native Xcode compilation, simulator behavior and iPad keyboard/safe-area behavior require macOS validation.
- Metro reports dependency export warnings while resolving React Native feature flags; both bundling and native review complete.
- Formatting, whitespace and all eleven asset checksums: passed.

The three reference frames were compared against native Android captures at 390 × 844. [figma-comparison.png](figma-comparison.png) places Figma beside the implementation. The comparison exposed and corrected Android counter text-fitting and replaced elevation with Figma's explicit tab shadow.

All three screens were captured at 320 × 568, 360 × 800, 375 × 812, 390 × 844, 412 × 915, 430 × 932, 768 × 1024, 1024 × 1366 and 1024 × 768 logical Android sizes. [figma-responsive-review.png](figma-responsive-review.png) shows four representative sizes. Short viewports use scrolling to reach lower content; Registration keeps its actions in the footer. Input, visible action and tab bounds were checked for horizontal overflow across the matrix.

The entire onboarding flow also passed natively at 320 × 568. Scrolling makes the primary action fully visible above the tabs, and tapping it creates the first available table: [figma-small-phone-scroll.png](figma-small-phone-scroll.png).

At 320 × 568, Registration's focused mobile field and both actions remain above the open keyboard: [figma-keyboard-review.png](figma-keyboard-review.png). Login was also inspected with a 1.5 system text scale: [figma-large-text-review.png](figma-large-text-review.png). These Android emulator checks do not substitute for native iPad or iPhone validation.

This report applies to the verified cloud-Figma scope. [verification.md](verification.md) records the earlier ZIP-based implementation and its historical checks.
