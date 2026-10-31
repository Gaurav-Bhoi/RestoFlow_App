import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Platform,
  StyleSheet,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { BottomSheet } from '../../components/BottomSheet';
import { AppButton } from '../../components/AppButton';
import { AppText } from '../../components/AppText';
import { SheetOption } from '../../components/SheetOption';
import { colors } from '../../theme/tokens';
import { useBluetoothPrinter } from './useBluetoothPrinter';
import { bluetoothPrinter, printerErrorMessage } from './bluetoothPrinter';

export function BluetoothPrinterSheet({
  visible,
  busy,
  printing,
  error,
  summary,
  onClose,
  onPrint,
  onSystemPrint,
  onSkip,
  skipSaveFailed,
  onKeepDraft,
}: {
  visible: boolean;
  busy: boolean;
  printing: boolean;
  error: string;
  summary: string;
  onClose: () => void;
  onPrint: (width: 58 | 80) => Promise<void>;
  onSystemPrint: () => void;
  onSkip: () => Promise<void>;
  skipSaveFailed?: boolean;
  onKeepDraft?: () => void;
}) {
  const { t } = useTranslation();
  const printer = useBluetoothPrinter(visible);
  const [paperWidth, setPaperWidth] = useState<58 | 80>(58);
  const [settingsError, setSettingsError] = useState('');
  const pendingPrint = useRef(false);
  async function print() {
    if (pendingPrint.current) return;
    pendingPrint.current = true;
    try {
      await onPrint(paperWidth);
    } finally {
      await printer.cancel();
      pendingPrint.current = false;
    }
  }
  const working =
    printer.phase === 'checking' ||
    printer.phase === 'scanning' ||
    printer.phase === 'connecting';
  async function settings() {
    setSettingsError('');
    try {
      const code =
        printer.error &&
        typeof printer.error === 'object' &&
        'code' in printer.error
          ? String(printer.error.code)
          : '';
      if (['PERMISSION_BLOCKED', 'PERMISSION_DENIED'].includes(code))
        await Linking.openSettings();
      else if (Platform.OS === 'android' && code === 'LOCATION_OFF')
        await Linking.sendIntent('android.settings.LOCATION_SOURCE_SETTINGS');
      else await bluetoothPrinter.openSettings();
    } catch {
      setSettingsError(t('bluetooth.settingsFailed'));
    }
  }
  return (
    <BottomSheet
      visible={visible}
      title={t('billing.printCustomerBill')}
      onClose={() => {
        if (!busy) onClose();
      }}
      footer={
        <View style={styles.actions}>
          {printing ? (
            <AppButton
              wrapLabel
              variant="secondary"
              onPress={() => {
                printer.cancel();
              }}
            >
              {t('bluetooth.stopPrinting')}
            </AppButton>
          ) : (
            <AppButton
              wrapLabel
              icon="print"
              disabled={busy || !printer.selected || working}
              onPress={print}
            >
              {t('billing.printBill')}
            </AppButton>
          )}
          <AppButton
            wrapLabel
            variant="ghost"
            loading={busy && !printing}
            disabled={printing}
            onPress={() => {
              printer.cancel().then(onSkip);
            }}
          >
            {t('bluetooth.continueWithoutPrinting')}
          </AppButton>
        </View>
      }
    >
      <AppText style={styles.summary}>{summary}</AppText>
      {skipSaveFailed && (
        <View style={styles.actions}>
          <AppText accessibilityRole="alert">
            {t('bluetooth.localDraftNote')}
          </AppText>
          <AppButton
            wrapLabel
            variant="secondary"
            disabled={busy}
            onPress={() => onKeepDraft?.()}
          >
            {t('bluetooth.keepDraftAndLeave')}
          </AppButton>
        </View>
      )}
      <AppText muted variant="helper">
        {t('bluetooth.compatibility')}
      </AppText>
      {Platform.OS === 'ios' && (
        <AppText muted variant="helper">
          {t('bluetooth.iosNote')}
        </AppText>
      )}
      <View style={styles.status}>
        {(working || printing) && <ActivityIndicator color={colors.forest} />}
        <AppText accessibilityLiveRegion="polite">
          {t(`bluetooth.${printing ? 'printing' : printer.phase}`)}
        </AppText>
      </View>
      {!!printer.selected && <AppText>{printer.selected.name}</AppText>}
      {!!(printer.error || error || settingsError) && (
        <AppText accessibilityRole="alert" style={styles.error}>
          {settingsError || error || printerErrorMessage(printer.error, t)}
        </AppText>
      )}
      {!printing && (
        <>
          {printer.devices.map(device => (
            <SheetOption
              key={`${device.id}-${device.transport}`}
              icon="print"
              label={`${device.name || t('bluetooth.unnamed')} · ${
                device.id
              } · ${
                device.paired ? t('bluetooth.paired') : t('bluetooth.nearby')
              } · ${device.transport === 'ble' ? 'BLE' : 'Bluetooth'}`}
              selected={
                printer.selected?.id === device.id &&
                printer.selected?.transport === device.transport
              }
              disabled={busy || working}
              onPress={() => {
                printer.connect(device);
              }}
            />
          ))}
          {printer.phase === 'ready' && printer.devices.length === 0 && (
            <AppText muted>{t('bluetooth.noPrinters')}</AppText>
          )}
          <View style={styles.widths}>
            <View style={styles.width}>
              <SheetOption
                label="58 mm"
                selected={paperWidth === 58}
                disabled={busy}
                onPress={() => setPaperWidth(58)}
              />
            </View>
            <View style={styles.width}>
              <SheetOption
                label="80 mm"
                selected={paperWidth === 80}
                disabled={busy}
                onPress={() => setPaperWidth(80)}
              />
            </View>
          </View>
          <AppText muted variant="helper">
            {t('bluetooth.statusNote')}
          </AppText>
          <AppButton
            wrapLabel
            variant="secondary"
            disabled={busy || working}
            onPress={() => {
              printer.scan();
            }}
          >
            {t('bluetooth.scanAgain')}
          </AppButton>
          {working && (
            <AppButton
              wrapLabel
              variant="ghost"
              onPress={() => {
                printer.cancel();
              }}
            >
              {t('bluetooth.cancelSearch')}
            </AppButton>
          )}
          <AppButton
            wrapLabel
            variant="ghost"
            disabled={busy || working}
            onPress={() => {
              settings();
            }}
          >
            {t('bluetooth.openSettings')}
          </AppButton>
          <AppButton
            wrapLabel
            variant="ghost"
            disabled={busy || working}
            onPress={onSystemPrint}
          >
            {t('bluetooth.useSystemPrinter')}
          </AppButton>
        </>
      )}
      <AppText muted variant="helper">
        {t('bluetooth.skipNote')}
      </AppText>
    </BottomSheet>
  );
}
const styles = StyleSheet.create({
  actions: { gap: 4 },
  summary: { color: colors.forest, marginBottom: 8 },
  status: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginVertical: 14,
  },
  error: { color: colors.error, marginVertical: 8 },
  widths: { flexDirection: 'row', gap: 8, marginVertical: 8 },
  width: { flex: 1 },
});
