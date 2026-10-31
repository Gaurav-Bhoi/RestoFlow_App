# Bluetooth receipt printing

The Receipt preview's **Print bill** sheet now checks Bluetooth and app permissions, searches for nearby devices, connects one selected device, and sends the server's immutable print-job receipt over Bluetooth. English and Marathi are bundled.

## Owner flow

1. Open **Print bill**. Grant Bluetooth/Nearby devices access; Android 11 and earlier also require foreground location permission and Location enabled for discovery.
2. If Bluetooth is off, open phone settings, turn it on and return. Search runs again after returning from an error state. Search and connection attempts can be cancelled.
3. Choose a paired or discovered device. Approve the operating system's pairing request if asked. Devices include names, identifiers and Classic/BLE transport so identically named printers can be distinguished. Discovery is bounded to 12 seconds; paired Android devices are included, even when not currently advertising.
4. Check that the printer is in ESC/POS receipt mode, choose 58 mm or 80 mm paper, and print. Keep the app open. Transport timeouts and disconnects are bounded. **Stop sending** closes the connection; bytes already received by the printer cannot be recalled.
5. Check the physical receipt before confirming it. A successful Bluetooth write records SENT, not CONFIRMED. The existing explicit confirmation/finish-visit flow remains in place. The sent screen also allows returning to the dashboard without confirming a print.
6. At every setup/recovery state, **Continue without printing** saves the latest bill and opens the Dashboard. It never invents a print confirmation or closes a visit. The existing backend only finishes visits with a confirmed print job; supporting visit closure without printing requires a backend contract change.
7. If the server cannot save the bill, **Keep draft on phone & open dashboard** is an explicit alternative. This preserves a local pending bill in MMKV, scoped to restaurant and customer. Reopening that customer's bill online restores the draft for review/save. A changed server revision or source order blocks saving until the owner reloads; no silent overwrite occurs. A successful save, share or print-job creation clears the pending draft. This is device-local storage, not a server backup or automatic background sync.

## Compatibility

| Printer/phone | Direct connection |
| --- | --- |
| Android Bluetooth Classic printer exposing SPP UUID `00001101-0000-1000-8000-00805f9b34fb` and ESC/POS raster commands | Implemented; Android handles pairing |
| Android or iPhone BLE printer exposing a supported serial endpoint and accepting ESC/POS raster commands | Implemented |
| Supported BLE service → write characteristic | `FF00 → FF02`, `FFF0 → FFF2`, `FFE0 → FFE1`, ISSC `49535343-FE7D-4AE5-8FA9-9FAFD205E455 → 49535343-8841-43F4-A8D4-ECBE34729BB3` |
| iPhone with a Classic-only serial printer | No generic SPP implementation; manufacturer-supported MFi integration/SDK or a compatible print service is needed |
| TSPL/ZPL/CPCL label printers, proprietary/encrypted BLE, vendor-specific services, ESC/POS devices without raster support | Need a model-specific adapter, compatible printer mode, or vendor print service |
| Device/system print service | Preserved as a separate option; the printer must actually be supported by an installed service |

Bluetooth transport does not identify a printer's command language. Photographs alone cannot establish model, firmware, enabled emulation or platform support. Device discovery deliberately includes other Bluetooth devices, and a connection is not a guarantee that a device understands receipts. The UI states the ESC/POS requirement and rejects BLE endpoints outside the supported list. No arbitrary writable BLE characteristic is used.

Receipts use the server print-job snapshot, including its bill number, exact item/total amounts, notes and timestamp. Native rasterization preserves Unicode and the rupee symbol without selecting a vendor text code page. 58 mm uses 384 dots; 80 mm uses 576 dots. Printing uses strip images and does not automatically cut paper. Printers with different printable widths/densities require model-specific calibration. A 30,000-character/50,000-dot-height limit bounds memory and work.

## Failure and recovery coverage

| Category | Behavior |
| --- | --- |
| No native module/old app build; no Bluetooth hardware | Clear error; system printing and skip remain available |
| Permission denied/permanently blocked; older Android Location disabled | Guidance to grant access/enable Location; app/phone settings and retry |
| Bluetooth off/revoked during use; phone interruption | Stop affected work, discard stale selections, reconnect; interrupted writes are treated as potentially partial |
| Discovery failure, empty results, unknown names, duplicate names/transports | Bounded search, identifying details, rescan, settings, system print, skip |
| Pairing rejected/failed, printer off/out of range/in use, stale pairing | Connection recovery guidance, bounded timeout, another printer or skip |
| Unsupported BLE services/protocols | Unsupported-device guidance and print-service/other-printer/skip options |
| Paper out/near end, cover open, offline, recoverable/unrecoverable hardware fault | Best-effort ESC/POS real-time checks before and after sending; reload/close/check/charge/reconnect guidance |
| Paper jam, overheated head, cutter fault, low battery | The generic hardware-error guidance covers these faults. Exact detection depends on model/status reporting; the app cannot identify faults the device never reports |
| Silent/write-only printer, missing/invalid status reply | Short status timeout, no fabricated ready/paper state; physical inspection remains required |
| Disconnect, cancellation or timeout after data may have left the phone | Potential partial/complete-print message; inspect receipt before an explicit retry. No automatic reprint |
| Lost server SENT acknowledgement after successful dispatch | Retry the server status update using the same job; do not dispatch another receipt during the same mounted receipt flow |
| Server save/create/update conflict, timeout, outage, authentication or other API failure | Existing API error shown; never confirm/finish falsely; retry or explicitly keep a local draft and leave |
| Repeated taps, cancelled operations completing late, hidden sheet | Single-operation guards, ignored stale callbacks, no scanning/permission request while hidden |
| Oversized receipt or unexpected native/vendor error | Bounded failure, readable generic recovery, system print/share/skip paths |

ESC/POS status is not a universal hardware API. Unsupported or absent status replies mean **unknown**. Successful transmission does not establish physical printing. A phone/app crash or killed process can also leave a physical print outcome unknown; do not infer that a receipt never printed after relaunch. No software can promise detection of every fault on every printer.

The paper/error masks follow [Epson's DLE EOT reference](https://download4.epson.biz/sec_pubs/pos/reference_en/escpos/dle_eot.html). Android permission and pairing behavior follow [Bluetooth permissions](https://developer.android.com/develop/connectivity/bluetooth/bt-permissions) and [connecting devices](https://developer.android.com/develop/connectivity/bluetooth/connect-bluetooth-devices). iPhone transport/vendor limits are described in [Apple Bluetooth](https://developer.apple.com/bluetooth/) and [External Accessory](https://developer.apple.com/documentation/externalaccessory/).

## Verification and release

- New native Android and iOS bridges require a native rebuild/reinstall; an OTA JavaScript update alone cannot add them. No production deployment or device installation was performed.
- TypeScript passed; ESLint passed with existing warnings and no errors; all 280 Jest tests across 17 suites passed. Focused tests cover permission selection, no hardware/Bluetooth off, scan/connect errors, late callbacks, cancellation, immutable snapshots, no duplicate dispatch after acknowledgement loss, unknown error recovery, skip/dashboard navigation and local-draft restore/conflict behavior.
- All 9 native JVM tests passed, exercising actual DLE EOT parsing for ready, paper-end, cover, hardware fault, offline, near-end, unavailable and invalid status replies.
- Android development APK build (`x86_64` emulator ABI), native status tests and Android lint (zero errors) were verified on Linux. iOS sources and Xcode project registration were added, but macOS/Xcode compilation and iPhone verification remain outstanding.
- Real-printer validation is required for each supported model/firmware/phone combination. Verify pairing/reconnection, 58/80 mm output, Unicode, long names/notes, paper removal before/during a print, cover, low battery, out-of-range, Bluetooth toggling, background/cancellation, and inspect behavior for write-only models. The supplied photos are not evidence that those exact models have been tested.
