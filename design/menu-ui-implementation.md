# Menu UI implementation

Reference: all 33 screenshots supplied on 22 October 2026. The zoomed screenshots define component measurements; the remaining screenshots define interactive states. Browser/Figma chrome, phone frames, status icons and home indicators are supplied by the native OS rather than drawn into the app.

## Scope and server data

The Menu tab now consumes the backend's list, detail, create, update and delete dish APIs under `/api/v1/restaurants/{restaurantId}/menu/dishes`. `MenuProvider` coordinates mutations and refreshes; `RestaurantProvider` shares confirmed menu data with ordering. Runtime mock fixtures and saving are removed. The screenshots remain the UI reference, and their interactions now wait for backend confirmation.

All creates and updates use multipart form data. Native photos retain their URI, MIME type and filename; bundled default illustrations stay local. Errors preserve drafts or saved dishes and offer retry. The Menu tab refreshes on focus and supports pull-to-refresh. See [the API integration contract](../docs/API_INTEGRATION.md#menu-management-api).

Owners can manage dishes; waiters can browse and search. The workspace sheet includes Menu and an owner-only Ledger preview. Ledger accounting is outside these screenshots.

## Screenshot coverage

All filenames begin with `Screenshot From 2026-10-22`.

| Screenshot time | Implemented UI/state |
| --- | --- |
| 01-33-37 | Menu header, search, five filters, illustrated card grid and floating tabs. |
| 01-38-10 | Menu title, workspace chevron and subtitle. |
| 01-38-48 | Add dish action and food illustration. |
| 01-39-11 | Pill search field and category spacing. |
| 01-39-40 | Category control and card layout. |
| 01-40-11 | White rounded dish card. |
| 01-40-49 | Food image surface and image aspect ratio. |
| 01-41-13 | Regular dish name typography. |
| 01-41-21 | Dish overflow action and touch target. |
| 01-41-29 | Dish description typography. |
| 01-41-34 | Rupee price typography. |
| 01-41-40 | Available status pill. |
| 01-41-48 | Vegetarian food marker. |
| 01-43-35 | Added dish at the top of the menu and success toast. |
| 01-43-48 | Paneer unavailable status and confirmation toast. |
| 01-43-57 | Paneer deletion, remaining dish reflow and toast. |
| 01-44-25 | Starters filter with a single matching dish. |
| 01-44-38 | Empty menu illustration, copy and first-dish action. |
| 01-44-45 | Restaurant workspace sheet. |
| 01-44-59 | Dish actions sheet with edit, availability and delete. |
| 01-45-07 | Centered delete confirmation with cancel/confirm. |
| 01-45-24 | Saved Dal Tadka edit and updated toast. |
| 01-45-32 | Dal Tadka unavailable status and toast. |
| 01-45-45 | Dal deletion, remaining dish reflow and toast. |
| 01-46-31 | Add Dish form with default illustration and footer. |
| 01-46-53 | Required name and valid-price errors. |
| 01-47-07 | Filled form, non-veg selection and saving state. |
| 01-47-14 | Unavailable form state and switch. |
| 01-47-20 | Prefilled Edit Dish form with unavailable switch. |
| 01-47-31 | Dish category sheet with selected row. |
| 01-47-36 | Camera/gallery source sheet and keep-image action. |
| 01-47-59 | Edit Dish food-type change. |
| 01-48-24 | Dal Tadka category selection in edit mode. |

Primary actions and selected filters use the existing forest fill so their white labels stay readable. The supplied illustrations remain SVG assets. Optional photos use the existing native image picker; iOS camera purpose text is included and requires a native rebuild on iOS.

## Reusable components

`ModalSurface`, `BottomSheet`, `SheetOption`, `ConfirmationDialog`, `ToggleSwitch` and `FoodTypeMark` provide reusable primitives. One modal surface switches between dish actions and deletion confirmation to avoid overlapping native modal presentations. Menu-specific components own workspace navigation, filters, cards, notices, photo/category sheets, food-type selection and availability. `useDishForm` owns draft validation and saving; the screen composes these controls.

## Responsive behavior

Menus center within the existing 600-point content frame; forms and sheets use 520 points. The two-column grid calculates widths from available space and changes to one column for very narrow views or larger text. Form price/category fields stack on small phones or with larger text. Forms scroll above the keyboard with a fixed action footer. Focused inputs are measured against the resized scroll viewport so the footer cannot cover them on small Android windows. Action labels wrap with larger text. Long sheets and dialogs scroll on short/landscape viewports. All overlays respect safe areas. The existing floating tabs reserve content clearance. Body content uses the app's existing English/Marathi localization and bounded text scaling.

## Verification

- TypeScript and ESLint checked; only three pre-existing `no-void` warnings remain.
- 151 mobile tests pass. Coverage includes all five authenticated endpoints, pagination beyond 100 dishes, native multipart image encoding, optional image retention, decimal-price boundaries, fresh edit details, pending requests, retries, unavailable/missing dishes, role access, shared ordering-cache updates, and stale-request protection.
- The backend's 83 existing business route, service, image and OpenAPI tests pass. The supplied backend source required no contract changes.
- Android production JavaScript bundle and asset compilation pass.
- Live DEV acceptance on Android passed for all five endpoints using the actual mobile API client and native multipart transport, including a real file URI upload, retained images, zero price, availability, server validation, and deleted-detail 404. The visible add/edit/category/price/availability/delete flow also passed against the temporary restaurant. Test records and uploaded images were removed after verifying persisted database fields; saved device credentials and production were unchanged. See [the acceptance capture](menu-api-native-acceptance.png) and [verification details](../docs/API_INTEGRATION.md#menu-management-api).
- The earlier Android UI review covered 320 × 568, 390 × 844, 768 × 1024 and 1024 × 768 logical sizes, including the keyboard and 150% system text. The review images below were captured with mock data during the UI phase; they document the visual layout rather than live API results.
- Native iOS execution is unavailable in this Linux workspace. iOS uses the existing system font; Android uses the existing native sans-serif fallback.

## Native review images

[Menu and form states](menu-ui-preview.png) · [Responsive and keyboard review](menu-responsive-preview.png)
