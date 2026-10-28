# Ledger screenshot implementation — 25 October 2026

The supplied screenshots describe three connected flows in the existing owner's **Menu → Ledger** workspace. Inspector selections and repeated screenshots are states of shared components. Tiny, effectively empty captures do not introduce additional screens.

## Screenshot mapping

All references below are filenames beginning `Screenshot From 2026-10-25`.

| Reference times | Implemented view / state |
| --- | --- |
| 16-13-21–16-15-00 | `LedgerScreen`, `LedgerSummary`, `ExpenseRow`: overview, totals, period/category tabs, search, filters and add action |
| 16-15-43 | Yesterday: date filter on the same ledger |
| 16-16-35, 16-16-52 | Empty ledger and no matching expenses, with working recovery actions |
| 16-17-40, 16-22-31–16-22-49 | Search mode on `LedgerScreen`, result count, clear and back actions |
| 16-18-15–16-20-43 | `ExpenseFiltersSheet`, nested period/category/payment choices, custom dates and amount limits |
| 16-21-00, 16-21-05 | Shared `ExpenseDateSheet`, Monday-first calendar, month navigation and explicit confirmation |
| 16-21-37–16-21-59 | Saved/deleted feedback through `LedgerNotice`; totals recompute from persisted entries |
| 16-24-44–16-26-46 | Shared add/edit `ExpenseFormScreen`, required-field validation, cancel and save |
| 16-27-07–16-29-25 | Shared category, inventory/miscellaneous subcategory and payment sheets |
| 16-29-44–16-30-06 | Receipt source sheet: camera, gallery and document picker |
| 16-30-25–16-32-06 | `ExpenseDetailsScreen`: summary, metadata, notes, receipt/no-receipt card, edit and delete actions |
| 16-32-25–16-32-43 | Existing confirmation dialog component, persistent deletion and error feedback |
| 16-33-43–16-34-18 | `ExpenseReceiptScreen`: actual image or rendered first PDF page, page count, full native PDF viewer and return action |
| 16-35-24–16-37-49 | `ExpenseReportScreen`: period, custom dates, category, PDF generation and shared choice/date sheets |
| 16-37-59–16-39-40 | `ExpenseReportPreviewScreen`: itemized report, category/grand totals, native download/print and feedback |
| 16-40-33–16-40-49 | Share sheet, system PDF handoff, Save to Files and Copy report |

## Integration and behavior

The existing React Navigation stacks, floating tabs, authentication, Redux, API clients, billing and menu management remain in place. Only owner sessions receive the new expense routes. Screens reuse `Screen`, `AppHeader`, `AppInput`, `AppButton`, `EmptyState`, `BottomSheet`, `ModalSurface` and the existing confirmation dialog. Shared additions are opt-in: non-scrolling `Screen` content for virtualized lists, pinned sheet footers, tall sheets and an input trailing accessory.

The previous Ledger workspace was a placeholder; this repository contains no expense API contract. `LedgerProvider` therefore persists expenses in the existing environment-scoped MMKV store, keyed by restaurant ID. Restaurant changes remount its state. There are no production fixtures, mocked API responses or invented network endpoints. These records are **local to the device**, with no server synchronization. Clearing application storage removes them. A future expense API can replace `expenseStorage` without replacing these screens.

Amounts are validated and stored as integer paise. Search covers names, translated categories/subcategories, vendors and notes. Date bounds are inclusive and use local calendar dates; weeks start Monday. Reports cover the selected calendar period and use one immutable snapshot for both the UI preview and native PDF. Filter changes remain drafts until Apply; dismissing a nested selector returns to the filter sheet. Empty and failed storage reads have separate recovery states; failed writes preserve the last saved ledger. Rapid duplicate saves are prevented.

English and Marathi copy use the existing i18next catalogs. Dates use the selected language. Indian currency grouping avoids Hermes' inconsistent `BigInt.toLocaleString` behavior while preserving exact monetary digits.

## Design and responsive layout

The screenshots' paper `#f6f5ef`, sage `#e5ece2`, forest `#173f35`, text, dividers and SF Pro match existing tokens and configured fonts. Content keeps the existing 22 dp phone gutters, 16 dp compact-phone gutters, 600 dp screen maximum and 520 dp form/sheet maximum. Controls use 44 dp icon targets, 54 dp fields, pill buttons, 24 dp summary corners and rounded sheets. Existing SVG icons are extended with matching outline assets.

Layouts use intrinsic text height, flex containers and live window dimensions. Paired form/date/amount fields stack below 310 dp of usable content or at enlarged font settings. Forms and sheet bodies scroll, while their actions stay outside the scroller. Ledger rows and report rows use `FlatList`. Safe areas and keyboard handling come from the existing shared components. No screenshot, inspector panel, fake status bar or home indicator is embedded in the application.

Readable filled primary buttons and selected pills are retained from the existing app. Several reference captures show white text with transparent button/selection fills. The share sheet uses **Copy report** because this project has no service that hosts public report links; it copies the actual report text. PDF receipt previews show the attached document, rather than a fabricated example invoice. The first page is rendered in-app; the native viewer handles the full PDF.

## Native files and release requirements

`LedgerFiles` is implemented in Kotlin and Swift and registered with the existing native applications. It copies selected receipts into private application files, accepts PDF/JPEG/PNG/WebP up to 10 MB, renders the first PDF page, generates paginated A4 reports, exports through system file pickers, hands PDFs to sharing applications, previews documents and copies report text. Cancellation does not show a saved-success message. No message is sent automatically.

Receipts remain in private `ledger/receipts`. Generated reports use private `ledger/reports`, retained during save/share handoff; reports older than seven days are removed when another report is generated. Keeping reports out of the OS-purgeable cache fixes the low-storage case observed during Android verification. Preview bitmaps use the cache. Android FileProvider grants access only to the receipt/report directories. On iOS generated reports are excluded from backup, and native presenters have iPad popover anchors.

These native additions require a **new Android/iOS binary**; an OTA JavaScript update alone is insufficient. Android compiled successfully. iOS sources and Xcode project registration are included, but native iOS compilation and device acceptance remain unverified because this workspace is Linux.

## Verification

- TypeScript: `npm run typecheck` passed.
- ESLint: `npm run lint` passed with zero errors and three pre-existing `no-void` warnings outside the ledger changes.
- Application tests: 15 suites / 206 tests passed, including 33 new ledger assertions/cases for screenshot totals, exact currency, dates, filtering, tenant isolation, corrupt storage, failed writes, create/edit/delete, duplicate saves, report retries, cancelled downloads and receipt rendering.
- Infrastructure: seven checks passed with `npm run test:infrastructure`.
- Android: `:app:assembleDevelopmentDebug --offline -PreactNativeArchitectures=x86_64` passed; the development APK was installed and exercised in the emulator.
- Native PDF: the nine-entry reference data generated a valid one-page 595 × 842 pt A4 PDF, with ₹48,750 total, and saved successfully to Downloads. A 120-row report generated nine A4 pages; extracted text contained all 120 rows, the last expense and the grand total. Its PDF page also rendered inside the app.
- Android visual checks covered the 390 × 844 dp reference viewport, 320 × 568 dp compact form, 768 × 1024 dp centered tablet form and a live landscape resize. Calendar rounding was corrected after the first native review. These checks do not replace iPhone/iPad or physical foldable acceptance.
- Normal owner navigation into Menu → Ledger was verified after restoring the application entry point. A blank save showed inline validation and focused the name field; the input and actions remained visible with the native keyboard open. No expense was saved in that normal session.
- Verification used a temporary isolated restaurant fixture and preview entry point, both removed afterward. The normal `index.js` is restored. No backend data was seeded or changed for this review.

Native captures: [phone flows](ledger-ui-preview.png), [responsive forms](ledger-responsive-preview.png), [validation with keyboard](ledger-keyboard-preview.png). They are verification artifacts, not application assets.
