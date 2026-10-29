# Orders, billing, and receipts

All **221 supplied screenshots** were reviewed, including repeated inspector selections, text metrics, validation states, overlays, and both receipt generations. No reference is dropped. The [manifest](order-billing-image-manifest.json) lists each original filename, dimensions, SHA-256, review status, screen state, and implementation. Indices follow the attached image order.

| References | Screen / state                            | Implementation                                                           |
| ---------- | ----------------------------------------- | ------------------------------------------------------------------------ |
| 1–16       | Owner customers                           | [CustomersScreen.tsx](../src/features/orders/CustomersScreen.tsx)        |
| 17–38      | Customer bill details                     | [BillOverviewScreen.tsx](../src/features/billing/BillOverviewScreen.tsx) |
| 39–54      | Four-column receipt preview               | [ReceiptScreen.tsx](../src/features/billing/ReceiptScreen.tsx)           |
| 55–66      | Receipt confirmation and finish visit     | [PrintSuccessScreen.tsx](../src/features/billing/PrintSuccessScreen.tsx) |
| 67–70      | Waiter empty table                        | [CustomersScreen.tsx](../src/features/orders/CustomersScreen.tsx)        |
| 71–83      | Waiter customer orders                    | [CustomersScreen.tsx](../src/features/orders/CustomersScreen.tsx)        |
| 84–106     | New customer and empty order              | [OrderScreen.tsx](../src/features/orders/OrderScreen.tsx)                |
| 107–117    | Selected order quantities                 | [OrderDishRow.tsx](../src/features/orders/OrderDishRow.tsx)              |
| 118–119    | Filtered order and complete summary       | [OrderScreen.tsx](../src/features/orders/OrderScreen.tsx)                |
| 120–147    | Editable bill                             | [BillScreen.tsx](../src/features/billing/BillScreen.tsx)                 |
| 148–149    | Updated bill quantities and unsaved edits | [BillScreen.tsx](../src/features/billing/BillScreen.tsx)                 |
| 150        | Bill saved feedback                       | [useBillDraft.ts](../src/features/billing/useBillDraft.ts)               |
| 151–159    | Bill name editor                          | [BillItemEditor.tsx](../src/features/billing/BillItemEditor.tsx)         |
| 160        | Bill price editor                         | [BillItemEditor.tsx](../src/features/billing/BillItemEditor.tsx)         |
| 161–168    | Quantity editor initial and changed       | [BillItemEditor.tsx](../src/features/billing/BillItemEditor.tsx)         |
| 169–174    | Quantity validation error                 | [BillItemEditor.tsx](../src/features/billing/BillItemEditor.tsx)         |
| 175–176    | Added paneer quantity and bill total      | [BillScreen.tsx](../src/features/billing/BillScreen.tsx)                 |
| 177–183    | Add item to bill                          | [BillAddItemSheet.tsx](../src/features/billing/BillAddItemSheet.tsx)     |
| 184–188    | Manage bill items                         | [BillScreen.tsx](../src/features/billing/BillScreen.tsx)                 |
| 189        | Remove item confirmation                  | [ConfirmationDialog.tsx](../src/components/ConfirmationDialog.tsx)       |
| 190–199    | Latest edited receipt preview             | [ReceiptScreen.tsx](../src/features/billing/ReceiptScreen.tsx)           |
| 200–208    | Print customer bill sheet                 | [ReceiptScreen.tsx](../src/features/billing/ReceiptScreen.tsx)           |
| 209        | Share customer bill sheet                 | [ReceiptScreen.tsx](../src/features/billing/ReceiptScreen.tsx)           |
| 210–213    | PDF download ready                        | [BillStatus.tsx](../src/features/billing/BillStatus.tsx)                 |
| 214–219    | Printing in progress                      | [BillStatus.tsx](../src/features/billing/BillStatus.tsx)                 |
| 220–221    | Bill sent to printer                      | [PrintSuccessScreen.tsx](../src/features/billing/PrintSuccessScreen.tsx) |

## Visual and responsive behavior

The app uses the supplied paper `#F6F5EF`, forest `#173F35`, ink `#22352D`, sage `#E5ECE2`, avatar `#D5E3D4`, and divider colors. It reuses the bundled SF Pro fonts and food illustrations. Figma’s editor chrome, selection outlines, handles, rulers, device time and home indicator are reference metadata, not app controls. Native system bars and safe areas supply the device chrome.

At the 390-point reference width: page padding 22, customer cards radius 27 with 18/19-point inset and 16-point gaps, avatar 40, heading 25/35, section 21/29.4, body 14/21, details 12/18, badges about 26.5 high, controls at least 44 and primary actions at least 50. The bill hero is 113 high/radius 24; original details hero 160.25/radius 28. Receipt paper uses radius 24 in the latest layout and radius 7 in the original layout. Status circles are 126 in the latest screens, 104 in the earlier visit confirmation. Modal sheets share the paper surface, dimmed backdrop, handle and rounded top corners. Content can grow with localized text rather than clipping to the screenshot’s fixed 844-point frame.

Content is centered and capped at 600 points (sheets 520), with safe-area insets and fixed footers. Small phones use 16-point side padding. Narrow widths, large text, or long monetary values switch the editable table to labelled stacked rows. Order controls wrap beneath dish details on small phones and with larger text. Titles and actions wrap, list content scrolls, and sheets avoid the keyboard. Standard font scaling is supported up to the app’s existing 1.5 multiplier. Both English and Marathi strings are included.

Later source screenshots show white action labels with missing button fills. Actions use the reference forest fill to remain legible and operable. Menu and customer content comes from the current restaurant; screenshot fixture names, dates, totals and printer readiness are not hardcoded into production.

## Reachable flows

- Owner: empty or occupied table → **Add customer** → customer name, dishes and quantities → confirm. The order form and save operation are available to owners as well as waiters. Existing customer cards open the editable bill. Tap name, quantity or price for its editor; add items, confirm removal, save with the double-check control, or preview the receipt. The options sheet also opens **View bill details**, preserving the original read-only details → four-column receipt → cancel/print flow.
- Waiter: empty or occupied table → new customer / edit customer order → search and quantities → confirm. The filtered summary retains all selected dishes even when a search hides some rows. The owner’s edited bill remains separate from the waiter’s original order.
- Receipt: latest draft preview → print sheet or sharing options. Printing displays its real pending state. PDF success appears only after the native file export completes; cancellation stays on the receipt. Sharing opens WhatsApp/email composition so the user controls delivery.
- Print completion: latest sent screen → customers, or **Confirm receipt & finish visit** → original receipt confirmation → finish just that guest. Reprint opens a new receipt flow. Opening a print service does not by itself finish the visit or prove physical printing.

## API behavior

`src/api/billing.ts` follows the local backend’s `docs/BILLING_API.md`: paginated table customers; bill preview/save; immutable print jobs with request IDs and status; guest-specific finish; sharing intents. Prices use integer paise, exact decimal strings, and the original six-digit timestamp token for optimistic concurrency. Failed or stale saves preserve the draft and offer an explicit reload. Returning from a preview accepts a saved revision only when its lines match the draft. A lost SENT acknowledgement retries status without dispatching another native print.

Waiter quantity changes submit the entire selection with the backend’s atomic PUT-items endpoint, preserving existing snapshots. Customer renaming uses its separate PATCH endpoint; a rename failure leaves the confirmed item selection intact and editable. This backend contract must be available in the target environment; no backend deployment is performed by this UI change. Printer selection uses the actual device print service rather than claiming a configured receipt printer is ready.

## Validation

Validated on 29 October 2026:

- All 221 original image files and SHA-256 hashes verified against the manifest; every image maps to an existing implementation.
- TypeScript: `npm run typecheck` passed.
- ESLint: `npm run lint` passed with three existing `no-void` warnings in localization/settings files and no errors.
- Jest: 16 suites / 234 tests passed, covering owner and waiter navigation from an empty table through customer creation and adding another customer, billing arithmetic, field validation, editor interactions, stale revisions, preview return, atomic order saves, print acknowledgement retries, print cancellation, PDF export cancellation, and guest-specific completion.
- Infrastructure: all 7 checks passed.
- Android: offline `:app:assembleDevelopmentDebug` build passed for x86_64.
- The production Android JavaScript bundle and 19 bundled assets generated successfully from the restored `index.js` entry point. Metro reported an existing React Native feature-flags export fallback warning.
- Native emulator review: 390-point phone, 320 × 568 phone, 150% system text, 768 × 1024 tablet, tablet landscape, and 568 × 320 phone landscape. Scrolling keeps long content accessible; the keyboard check also prompted a shared sheet fix that keeps the input and Apply action above the software keyboard.
- Native print dialog cancellation returns to the receipt without completing a guest. Android Save as PDF confirms accepted print dispatch; the separate PDF export completes through the system file picker before displaying success. Physical printer hardware was not available.

The following captures use local sample restaurant data in the real Android app. The temporary review harness was removed and the normal entry point restored. Live backend deployment/integration and an iOS native build are outside this verification; iOS cannot be built on this Linux host.

| Review                     | Native capture                                                                 |
| -------------------------- | ------------------------------------------------------------------------------ |
| Customer cards             | [Phone customers](reviews/orders-billing/phone-customers.png)                  |
| Editable bill              | [Phone bill](reviews/orders-billing/phone-bill.png)                            |
| Quantity editor            | [Phone quantity](reviews/orders-billing/phone-quantity.png)                    |
| Small phone with keyboard  | [320-point keyboard layout](reviews/orders-billing/small-phone-keyboard.png)   |
| Small phone with 150% text | [Large-text customer cards](reviews/orders-billing/small-phone-large-text.png) |
| Tablet                     | [Tablet bill](reviews/orders-billing/tablet-bill.png)                          |
| Earlier receipt layout     | [Four-column receipt](reviews/orders-billing/original-receipt.png)             |
| Sharing choices            | [Share sheet](reviews/orders-billing/share-options.png)                        |
| Completed PDF export       | [PDF ready](reviews/orders-billing/pdf-ready.png)                              |
