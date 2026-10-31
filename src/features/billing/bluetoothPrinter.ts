import { NativeModules, PermissionsAndroid, Platform } from 'react-native';
import type { CustomerBill } from '../../api/billing';
import type { TFunction } from 'i18next';
import { formatCurrency } from '../../utils/currency';
import { billDate, billTime } from './billExport';

export interface BluetoothPrinterDevice {
  id: string;
  name: string;
  paired: boolean;
  transport: 'classic' | 'ble';
}
export interface BluetoothPrinterState {
  enabled: boolean;
  supported: boolean;
}
interface PrinterBridge {
  state(): Promise<BluetoothPrinterState>;
  scan(): Promise<BluetoothPrinterDevice[]>;
  connect(id: string, transport: string): Promise<void>;
  printReceipt(text: string, paperWidth: number): Promise<void>;
  cancel(): Promise<void>;
  openSettings(): Promise<void>;
}

export function printerFailure(code: string) {
  return Object.assign(new Error(code), { code });
}
function bridge(): PrinterBridge {
  if (!NativeModules.BluetoothReceiptPrinter)
    throw printerFailure('PRINTER_UNAVAILABLE');
  return NativeModules.BluetoothReceiptPrinter;
}
export const bluetoothPrinter = {
  async prepare() {
    const native = bridge();
    if (Platform.OS === 'android') {
      const permissions =
        Number(Platform.Version) >= 31
          ? [
              PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
              PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
            ]
          : [PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION];
      const result = await PermissionsAndroid.requestMultiple(permissions);
      if (
        permissions.some(
          permission =>
            result[permission] !== PermissionsAndroid.RESULTS.GRANTED,
        )
      )
        throw printerFailure(
          Object.values(result).includes(
            PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN,
          )
            ? 'PERMISSION_BLOCKED'
            : 'PERMISSION_DENIED',
        );
    }
    return native.state();
  },
  state: async () => bridge().state(),
  scan: async () => bridge().scan(),
  connect: async (device: BluetoothPrinterDevice) =>
    bridge().connect(device.id, device.transport),
  print: async (text: string, paperWidth: 58 | 80) =>
    bridge().printReceipt(text, paperWidth),
  cancel: async () => {
    if (NativeModules.BluetoothReceiptPrinter) await bridge().cancel();
  },
  openSettings: async () => bridge().openSettings(),
};

// Rasterized by the native bridge so Unicode names and ₹ do not depend on a
// printer's code page. The immutable server print-job snapshot is the source.
export function bluetoothReceiptText(
  bill: CustomerBill,
  t: TFunction,
  language: string,
) {
  return [
    bill.restaurantName,
    `${bill.table.name} · ${bill.customerName ?? ''}`,
    `${billDate(bill, language)} · ${billTime(bill, language)}`,
    bill.billNumber ? t('billing.billNumber', { number: bill.billNumber }) : '',
    '--------------------------------',
    ...bill.items.flatMap(line => [
      line.name,
      `${line.quantity} × ${formatCurrency(line.unitPrice)}    ${formatCurrency(
        line.lineTotal,
      )}`,
      ...(line.note ? [line.note] : []),
      '',
    ]),
    '--------------------------------',
    `${t('billing.taxesCharges')}: ${formatCurrency(bill.taxesAndCharges)}`,
    `${t('billing.grandTotal')}: ${formatCurrency(bill.total)}`,
    '',
    t('billing.thankYouForDiningWithUsWeHopeTo'),
  ].join('\n');
}

const failureKeys: Record<string, string> = {
  PRINTER_UNAVAILABLE: 'unavailable',
  BLUETOOTH_UNSUPPORTED: 'unsupportedPhone',
  BLUETOOTH_OFF: 'bluetoothOff',
  PERMISSION_DENIED: 'permissionDenied',
  PERMISSION_BLOCKED: 'permissionBlocked',
  LOCATION_OFF: 'locationOff',
  SCAN_FAILED: 'scanFailed',
  CONNECT_FAILED: 'connectFailed',
  CONNECT_TIMEOUT: 'connectTimeout',
  PRINTER_UNSUPPORTED: 'unsupportedPrinter',
  PRINTER_DISCONNECTED: 'disconnected',
  PAPER_OUT: 'paperOut',
  COVER_OPEN: 'coverOpen',
  PRINTER_ERROR: 'printerError',
  PRINTER_OFFLINE: 'offline',
  PAPER_LOW: 'paperLow',
  PRINT_UNCERTAIN: 'uncertain',
  PRINT_CANCELLED: 'cancelled',
  PRINTER_BUSY: 'busy',
  RECEIPT_TOO_LARGE: 'tooLarge',
};
export function printerErrorMessage(error: unknown, t: TFunction) {
  const code =
    error && typeof error === 'object' && 'code' in error
      ? String(error.code)
      : '';
  return t(`bluetooth.errors.${failureKeys[code] ?? 'unknown'}`);
}
