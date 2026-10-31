import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import {
  bluetoothPrinter,
  printerFailure,
  type BluetoothPrinterDevice,
} from './bluetoothPrinter';

export function useBluetoothPrinter(visible: boolean) {
  const [devices, setDevices] = useState<BluetoothPrinterDevice[]>([]);
  const [selected, setSelected] = useState<BluetoothPrinterDevice | null>(null);
  const [phase, setPhase] = useState<
    'checking' | 'scanning' | 'ready' | 'connecting' | 'connected' | 'error'
  >('checking');
  const [error, setError] = useState<unknown>(null);
  const generation = useRef(0);
  const phaseRef = useRef(phase);
  phaseRef.current = phase;
  const scan = useCallback(async () => {
    const current = ++generation.current;
    setSelected(null);
    setError(null);
    setPhase('checking');
    try {
      await bluetoothPrinter.cancel();
      const state = await bluetoothPrinter.prepare();
      if (current !== generation.current) return;
      if (!state.supported) throw printerFailure('BLUETOOTH_UNSUPPORTED');
      if (!state.enabled) throw printerFailure('BLUETOOTH_OFF');
      setPhase('scanning');
      const found = await bluetoothPrinter.scan();
      if (current !== generation.current) return;
      setDevices(found);
      setPhase('ready');
    } catch (cause) {
      if (current === generation.current) {
        setError(cause);
        setPhase('error');
      }
    }
  }, []);
  useEffect(() => {
    if (!visible) return;
    scan();
    const subscription = AppState.addEventListener('change', state => {
      if (state !== 'active' && phaseRef.current === 'connected') {
        setSelected(null);
        setPhase('ready');
      }
      if (state === 'active') {
        // Settings, permission prompts and system pairing all resume the app.
        // Only rescan an error state; never interrupt an active print/connection.
        if (phaseRef.current === 'error') scan();
      }
    });
    return () => {
      // This is an operation counter, not a rendered-node ref.
      generation.current += 1;
      subscription.remove();
      bluetoothPrinter.cancel().catch(() => undefined);
    };
  }, [visible, scan]);
  async function connect(device: BluetoothPrinterDevice) {
    const current = ++generation.current;
    setSelected(null);
    setPhase('connecting');
    setError(null);
    try {
      await bluetoothPrinter.connect(device);
      if (current === generation.current) {
        setSelected(device);
        setPhase('connected');
      }
    } catch (cause) {
      if (current === generation.current) {
        setError(cause);
        setPhase('error');
      }
    }
  }
  async function cancel() {
    const current = ++generation.current;
    await bluetoothPrinter.cancel().catch(() => undefined);
    if (current === generation.current) {
      setSelected(null);
      setPhase('ready');
    }
  }
  return { devices, selected, phase, error, scan, connect, cancel };
}
