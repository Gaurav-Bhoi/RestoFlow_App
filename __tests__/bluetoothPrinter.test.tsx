import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';
import {
  AppState,
  NativeModules,
  PermissionsAndroid,
  Platform,
  type AppStateStatus,
} from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import '../src/localization/i18n';
import i18n from '../src/localization/i18n';
import {
  bluetoothPrinter,
  bluetoothReceiptText,
  printerErrorMessage,
  printerFailure,
} from '../src/features/billing/bluetoothPrinter';
import { useBluetoothPrinter } from '../src/features/billing/useBluetoothPrinter';
import { BluetoothPrinterSheet } from '../src/features/billing/BluetoothPrinterSheet';
import { AppButton } from '../src/components/AppButton';
import { SheetOption } from '../src/components/SheetOption';
import { fixtureBill } from './support/billingFixtures';

const device = {
  id: '00:11:22:33:44:55',
  name: 'Receipt printer',
  paired: true,
  transport: 'classic' as const,
};
let renderer: ReactTestRenderer.ReactTestRenderer;
let hook: ReturnType<typeof useBluetoothPrinter>;
function Harness({ visible = true }: { visible?: boolean }) {
  hook = useBluetoothPrinter(visible);
  return null;
}
async function render(element: React.ReactElement) {
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <SafeAreaProvider>{element}</SafeAreaProvider>,
    );
  });
}
beforeEach(() => {
  jest
    .spyOn(bluetoothPrinter, 'prepare')
    .mockResolvedValue({ enabled: true, supported: true });
  jest.spyOn(bluetoothPrinter, 'scan').mockResolvedValue([device]);
  jest.spyOn(bluetoothPrinter, 'connect').mockResolvedValue(undefined);
  jest.spyOn(bluetoothPrinter, 'cancel').mockResolvedValue(undefined);
});
afterEach(async () => {
  if (renderer) await act(async () => renderer.unmount());
  jest.restoreAllMocks();
  delete NativeModules.BluetoothReceiptPrinter;
});

test('a hidden sheet never requests permissions or scans', async () => {
  await render(<Harness visible={false} />);
  expect(bluetoothPrinter.prepare).not.toHaveBeenCalled();
});
test('Bluetooth off is actionable and does not start discovery', async () => {
  jest
    .mocked(bluetoothPrinter.prepare)
    .mockResolvedValue({ enabled: false, supported: true });
  await render(<Harness />);
  expect(hook.phase).toBe('error');
  expect(hook.error).toMatchObject({ code: 'BLUETOOTH_OFF' });
  expect(bluetoothPrinter.scan).not.toHaveBeenCalled();
});
test('unsupported hardware never starts discovery', async () => {
  jest
    .mocked(bluetoothPrinter.prepare)
    .mockResolvedValue({ enabled: false, supported: false });
  await render(<Harness />);
  expect(hook.error).toMatchObject({ code: 'BLUETOOTH_UNSUPPORTED' });
});
test('permission errors remain recoverable and a retry can connect a selected device', async () => {
  jest
    .mocked(bluetoothPrinter.prepare)
    .mockRejectedValueOnce(printerFailure('PERMISSION_BLOCKED'));
  await render(<Harness />);
  expect(hook.phase).toBe('error');
  await act(async () => {
    await hook.scan();
  });
  expect(hook.devices).toEqual([device]);
  await act(async () => {
    await hook.connect(device);
  });
  expect(hook.phase).toBe('connected');
  expect(hook.selected).toEqual(device);
});
test('cancelling discovery ignores its late result', async () => {
  let finish!: (devices: (typeof device)[]) => void;
  jest.mocked(bluetoothPrinter.scan).mockImplementation(
    () =>
      new Promise(resolve => {
        finish = resolve;
      }),
  );
  await render(<Harness />);
  expect(hook.phase).toBe('scanning');
  await act(async () => {
    await hook.cancel();
    finish([device]);
  });
  expect(hook.phase).toBe('ready');
  expect(hook.devices).toEqual([]);
});
test('cancelling pairing ignores a late connection callback', async () => {
  let finish!: () => void;
  jest.mocked(bluetoothPrinter.connect).mockImplementation(
    () =>
      new Promise(resolve => {
        finish = resolve;
      }),
  );
  await render(<Harness />);
  await act(async () => {
    hook.connect(device);
  });
  await act(async () => {
    await hook.cancel();
    finish();
  });
  expect(hook.selected).toBeNull();
  expect(hook.phase).toBe('ready');
});
test('connection timeout clears the selection and allows another printer', async () => {
  jest
    .mocked(bluetoothPrinter.connect)
    .mockRejectedValueOnce(printerFailure('CONNECT_TIMEOUT'));
  await render(<Harness />);
  await act(async () => {
    await hook.connect(device);
  });
  expect(hook.error).toMatchObject({ code: 'CONNECT_TIMEOUT' });
  expect(hook.selected).toBeNull();
  await act(async () => {
    await hook.connect(device);
  });
  expect(hook.phase).toBe('connected');
});
test('returning from settings rescans a previously blocked state', async () => {
  let listener!: (state: AppStateStatus) => void;
  jest
    .spyOn(AppState, 'addEventListener')
    .mockImplementation((_event, callback) => {
      listener = callback;
      return { remove: jest.fn() };
    });
  jest
    .mocked(bluetoothPrinter.prepare)
    .mockRejectedValueOnce(printerFailure('PERMISSION_BLOCKED'));
  await render(<Harness />);
  await act(async () => {
    listener('active');
  });
  expect(hook.phase).toBe('ready');
});
test('a scan failure still exposes continue without printing', async () => {
  const skip = jest.fn(async () => undefined);
  jest
    .mocked(bluetoothPrinter.scan)
    .mockRejectedValue(printerFailure('SCAN_FAILED'));
  await render(
    <BluetoothPrinterSheet
      visible
      busy={false}
      printing={false}
      error=""
      summary="Bill"
      onClose={jest.fn()}
      onPrint={jest.fn()}
      onSystemPrint={jest.fn()}
      onSkip={skip}
    />,
  );
  const button = renderer.root
    .findAllByType(AppButton)
    .find(node => node.props.children === 'Continue without printing')!;
  await act(async () => {
    await button.props.onPress();
  });
  expect(skip).toHaveBeenCalledTimes(1);
  const print = renderer.root
    .findAllByType(AppButton)
    .find(node => node.props.children === 'Print bill')!;
  expect(print.props.disabled).toBe(true);
});
test('only one selected printer can print and paper width is forwarded', async () => {
  const print = jest.fn(async () => undefined);
  await render(
    <BluetoothPrinterSheet
      visible
      busy={false}
      printing={false}
      error=""
      summary="Bill"
      onClose={jest.fn()}
      onPrint={print}
      onSystemPrint={jest.fn()}
      onSkip={jest.fn()}
    />,
  );
  await act(async () => {
    await renderer.root
      .findAllByType(SheetOption)
      .find(node => node.props.label.startsWith(device.name))!
      .props.onPress();
  });
  await act(async () => {
    renderer.root
      .findAllByType(SheetOption)
      .find(node => node.props.label === '80 mm')!
      .props.onPress();
  });
  await act(async () => {
    await renderer.root
      .findAllByType(AppButton)
      .find(node => node.props.children === 'Print bill')!
      .props.onPress();
  });
  expect(print).toHaveBeenCalledWith(80);
});
test.each([
  'PAPER_OUT',
  'COVER_OPEN',
  'PRINTER_ERROR',
  'PRINTER_OFFLINE',
  'PRINT_UNCERTAIN',
  'PRINTER_UNSUPPORTED',
  'PERMISSION_BLOCKED',
  'CONNECT_FAILED',
  'CONNECT_TIMEOUT',
  'SCAN_FAILED',
  'BLUETOOTH_OFF',
  'PRINT_CANCELLED',
  'PRINTER_DISCONNECTED',
  'RECEIPT_TOO_LARGE',
  'PRINTER_BUSY',
  'UNRECOGNIZED_VENDOR_ERROR',
])('%s has readable recovery guidance', code => {
  const message = printerErrorMessage(printerFailure(code), i18n.t.bind(i18n));
  expect(message).not.toContain('bluetooth.errors.');
  expect(message.length).toBeGreaterThan(40);
});
test('Bluetooth receipt preserves Unicode, exact prices, notes and bill identity', () => {
  const text = bluetoothReceiptText(
    { ...fixtureBill, restaurantName: 'नेहाचे किचन', billNumber: 'RF-55' },
    i18n.t.bind(i18n),
    'en',
  );
  expect(text).toContain('नेहाचे किचन');
  expect(text).toContain('RF-55');
  expect(text).toContain('₹420');
  expect(text).toContain('Dal Tadka');
  expect(text).toContain('Grand total');
});
test('a missing native module fails explicitly without pretending to connect', async () => {
  jest.mocked(bluetoothPrinter.connect).mockRestore();
  await expect(bluetoothPrinter.connect(device)).rejects.toMatchObject({
    code: 'PRINTER_UNAVAILABLE',
  });
});
test.each([30, 31])(
  'Android API %i asks for the platform-specific permissions',
  async version => {
    jest.mocked(bluetoothPrinter.prepare).mockRestore();
    jest.replaceProperty(Platform, 'OS', 'android');
    jest.spyOn(Platform, 'Version', 'get').mockReturnValue(version);
    const request = jest
      .spyOn(PermissionsAndroid, 'requestMultiple')
      .mockImplementation(
        async permissions =>
          Object.fromEntries(
            permissions.map(permission => [permission, 'granted']),
          ) as Record<(typeof permissions)[number], 'granted'>,
      );
    NativeModules.BluetoothReceiptPrinter = {
      state: jest.fn(async () => ({ enabled: true, supported: true })),
    };
    await bluetoothPrinter.prepare();
    expect(request).toHaveBeenCalledWith(
      version === 30
        ? ['android.permission.ACCESS_FINE_LOCATION']
        : [
            'android.permission.BLUETOOTH_SCAN',
            'android.permission.BLUETOOTH_CONNECT',
          ],
    );
  },
);
