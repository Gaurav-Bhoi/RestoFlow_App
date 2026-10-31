import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { usePreventRemove } from '@react-navigation/native';
import type { RootScreenProps } from '../../app/navigationTypes';
import { normalizeApiError } from '../../api/errors';
import { AppHeader } from '../../components/AppHeader';
import { AppButton } from '../../components/AppButton';
import { AppText } from '../../components/AppText';
import { Screen } from '../../components/Screen';
import { EmptyState } from '../../components/EmptyState';
import { BottomSheet } from '../../components/BottomSheet';
import { SheetOption } from '../../components/SheetOption';
import { colors, layout } from '../../theme/tokens';
import { formatCurrency } from '../../utils/currency';
import { useReceipt } from './useReceipt';
import { BluetoothPrinterSheet } from './BluetoothPrinterSheet';
import {
  bluetoothPrinter,
  bluetoothReceiptText,
  printerErrorMessage,
} from './bluetoothPrinter';
import { BillIconButton } from './BillControls';
import { BillStatus } from './BillStatus';
import { ReadOnlyBill } from './ReadOnlyBill';
import { billDate, billTime, billPdfLabels, downloadBill } from './billExport';

export function ReceiptScreen({
  route,
  navigation,
}: RootScreenProps<'Receipt'>) {
  const { t, i18n } = useTranslation();
  const receipt = useReceipt(
    route.params.tableId,
    route.params.customerId,
    route.params.draft,
  );
  const [sheet, setSheet] = useState<'share' | 'print' | null>(null);
  const [exporting, setExporting] = useState(false);
  const [downloadReady, setDownloadReady] = useState(false);
  const [exportError, setExportError] = useState('');
  const pendingExport = useRef(false);
  const [completedJob, setCompletedJob] = useState<string | null>(null);
  const [skipped, setSkipped] = useState(false);
  const [bluetoothPrinting, setBluetoothPrinting] = useState(false);
  const tablePresentation = route.params.presentation === 'table';
  const busy = receipt.busy || exporting;
  usePreventRemove(busy, () => undefined);
  useEffect(() => {
    if (completedJob && !busy)
      navigation.replace('PrintSuccess', {
        tableId: route.params.tableId,
        customerId: route.params.customerId,
        printJobId: completedJob,
      });
  }, [
    completedJob,
    busy,
    navigation,
    route.params.tableId,
    route.params.customerId,
  ]);
  useEffect(() => {
    if (skipped && !busy) navigation.popTo('Home', { screen: 'Dashboard' });
  }, [skipped, busy, navigation]);
  async function handleBluetoothPrint(width: 58 | 80) {
    setBluetoothPrinting(true);
    try {
      const id = await receipt.print(async snapshot => {
        try {
          await bluetoothPrinter.print(
            bluetoothReceiptText(snapshot, t, i18n.language),
            width,
          );
        } catch (cause) {
          const message = printerErrorMessage(cause, t);
          throw Object.assign(new Error(message), {
            code:
              'code' in Object(cause)
                ? (cause as { code: string }).code
                : 'UNKNOWN',
          });
        }
      });
      if (id) {
        setSheet(null);
        setCompletedJob(id);
      }
    } finally {
      setBluetoothPrinting(false);
    }
  }
  async function handleSkip() {
    if (await receipt.continueWithoutPrinting()) {
      setSheet(null);
      setSkipped(true);
    }
  }
  async function handlePrint() {
    setSheet(null);
    const printJobId = await receipt.print();
    if (printJobId) setCompletedJob(printJobId);
  }
  async function handleDownload() {
    if (!receipt.bill || pendingExport.current) return;
    pendingExport.current = true;
    setExporting(true);
    setExportError('');
    try {
      const saved = await downloadBill(
        receipt.bill,
        billPdfLabels(t),
        i18n.language,
      );
      if (saved) {
        setSheet(null);
        setDownloadReady(true);
      }
    } catch (cause) {
      setExportError(normalizeApiError(cause).message);
    } finally {
      pendingExport.current = false;
      setExporting(false);
    }
  }
  const bill = receipt.bill;
  if ((receipt.printing && !bluetoothPrinting) || downloadReady)
    return (
      <Screen>
        <BillStatus
          loading={receipt.printing}
          title={t(
            receipt.printing ? 'billing.printingBill' : 'billing.pdfReady',
          )}
          description={t(
            receipt.printing
              ? 'billing.sendingLatestBill'
              : 'billing.pdfIncludesEdits',
            { name: bill?.customerName },
          )}
        >
          {downloadReady ? (
            <AppButton wrapLabel onPress={navigation.goBack}>
              {t('billing.backToBill')}
            </AppButton>
          ) : (
            <AppButton wrapLabel disabled onPress={() => undefined}>
              {t('billing.printing')}
            </AppButton>
          )}
        </BillStatus>
      </Screen>
    );
  if (receipt.loading || !bill)
    return (
      <Screen
        header={
          <AppHeader
            wrap
            title={t('billing.receiptPreview')}
            onBack={navigation.goBack}
          />
        }
      >
        {receipt.error ? (
          <EmptyState
            title={t('api.loadBillFailed')}
            description={receipt.error}
            action={{
              label: t('billing.backToBill'),
              onPress: navigation.goBack,
            }}
          />
        ) : (
          <AppText>{t('api.loadingBill')}</AppText>
        )}
      </Screen>
    );
  return (
    <>
      <Screen
        header={
          <AppHeader
            wrap
            title={t(
              tablePresentation
                ? 'billing.readyToPrint'
                : 'billing.receiptPreview',
            )}
            subtitle={t(
              tablePresentation
                ? 'billing.receiptPreview'
                : 'billing.latestValuesReady',
            )}
            onBack={navigation.goBack}
            backDisabled={busy}
            right={
              <BillIconButton
                icon="share"
                label={t('billing.shareBill')}
                disabled={busy}
                onPress={() => setSheet('share')}
              />
            }
          />
        }
        footer={
          tablePresentation ? (
            <View style={styles.footerRow}>
              <AppButton
                wrapLabel
                variant="secondary"
                disabled={busy}
                onPress={navigation.goBack}
                style={styles.cancel}
              >
                {t('billing.cancel')}
              </AppButton>
              <AppButton
                wrapLabel
                icon="print"
                disabled={busy}
                onPress={() => setSheet('print')}
                style={styles.printAction}
              >
                {t('billing.printBill')}
              </AppButton>
            </View>
          ) : (
            <AppButton
              wrapLabel
              icon="print"
              disabled={busy}
              onPress={() => setSheet('print')}
            >
              {t('billing.printBill')}
            </AppButton>
          )
        }
      >
        <View style={[styles.paper, tablePresentation && styles.tablePaper]}>
          <View style={styles.heading}>
            <AppText
              style={[
                styles.restaurant,
                tablePresentation && styles.tableRestaurant,
              ]}
            >
              {tablePresentation
                ? bill.restaurantName
                : bill.restaurantName.toLocaleUpperCase()}
            </AppText>
            <AppText muted style={styles.identity}>
              {bill.table.name} · {bill.customerName}
            </AppText>
            <AppText muted variant="helper">
              {billDate(bill, i18n.language)}
              {tablePresentation ? ` · ${billTime(bill, i18n.language)}` : ''}
              {bill.billNumber
                ? ` · ${t('billing.billNumber', { number: bill.billNumber })}`
                : ''}
            </AppText>
          </View>
          {tablePresentation ? (
            <ReadOnlyBill bill={bill} />
          ) : (
            <>
              <View style={styles.lines}>
                {bill.items.map(line => (
                  <View key={line.id} style={styles.line}>
                    <View style={layout.row}>
                      <AppText style={styles.item}>{line.name}</AppText>
                      <AppText style={styles.amount}>
                        {formatCurrency(line.lineTotal)}
                      </AppText>
                    </View>
                    <AppText muted variant="helper" style={styles.quantity}>
                      {line.quantity} × {formatCurrency(line.unitPrice)}
                    </AppText>
                    {!!line.note && (
                      <AppText muted variant="helper">
                        {line.note}
                      </AppText>
                    )}
                  </View>
                ))}
              </View>
              <View style={styles.totals}>
                <View style={layout.row}>
                  <AppText muted variant="small">
                    {t('billing.taxesCharges')}
                  </AppText>
                  <AppText variant="small">
                    {formatCurrency(bill.taxesAndCharges)}
                  </AppText>
                </View>
                <View style={[layout.row, styles.grand]}>
                  <AppText style={styles.totalLabel}>
                    {t('billing.grandTotal')}
                  </AppText>
                  <AppText style={styles.total}>
                    {formatCurrency(bill.total)}
                  </AppText>
                </View>
              </View>
            </>
          )}
          {tablePresentation && (
            <AppText muted variant="helper" style={styles.thanks}>
              {t('billing.thankYouForDiningWithUsWeHopeTo')}
            </AppText>
          )}
        </View>
        <AppText muted variant="helper" style={styles.caption}>
          {t(
            tablePresentation
              ? 'bluetooth.previewNote'
              : 'billing.appliedWhenSaved',
          )}
        </AppText>
        {!!receipt.error && (
          <AppText accessibilityRole="alert" style={styles.error}>
            {receipt.error}
          </AppText>
        )}
      </Screen>
      <BluetoothPrinterSheet
        visible={sheet === 'print'}
        busy={busy}
        printing={bluetoothPrinting}
        error={receipt.error}
        summary={t('billing.printSummary', {
          name: bill.customerName,
          count: bill.itemCount,
          total: formatCurrency(bill.total),
        })}
        onClose={() => setSheet(null)}
        onPrint={handleBluetoothPrint}
        onSystemPrint={handlePrint}
        onSkip={handleSkip}
        skipSaveFailed={receipt.skipSaveFailed}
        onKeepDraft={() => {
          if (receipt.keepDraftOnPhone()) {
            setSheet(null);
            setSkipped(true);
          }
        }}
      />
      <BottomSheet
        visible={sheet === 'share'}
        title={t('billing.shareCustomerBill')}
        onClose={() => {
          if (!busy) setSheet(null);
        }}
      >
        <SheetOption
          plain
          trailing
          label={t('billing.whatsApp')}
          disabled={busy}
          onPress={() => {
            receipt.share('WHATSAPP').then(ok => {
              if (ok) setSheet(null);
            });
          }}
        />
        <SheetOption
          plain
          trailing
          label={t('billing.email')}
          disabled={busy}
          onPress={() => {
            receipt.share('EMAIL').then(ok => {
              if (ok) setSheet(null);
            });
          }}
        />
        <SheetOption
          plain
          trailing
          label={t('billing.downloadPdf')}
          disabled={busy}
          onPress={handleDownload}
        />
        {busy && <ActivityIndicator color={colors.forest} />}
        {!!(exportError || receipt.error) && (
          <AppText accessibilityRole="alert" style={styles.error}>
            {exportError || receipt.error}
          </AppText>
        )}
      </BottomSheet>
    </>
  );
}
const styles = StyleSheet.create({
  tablePaper: {
    marginHorizontal: 10,
    borderRadius: 7,
    paddingHorizontal: 20,
    paddingBottom: 28,
  },
  tableRestaurant: { fontSize: 19, lineHeight: 26.6 },
  thanks: { textAlign: 'center', marginTop: 30 },
  footerRow: { flexDirection: 'row', gap: 10 },
  cancel: { flex: 1 },
  printAction: { flex: 1.92 },
  paper: {
    backgroundColor: colors.white,
    borderRadius: 24,
    marginHorizontal: 17,
    marginTop: 10,
    paddingHorizontal: 18,
    paddingTop: 22,
    paddingBottom: 48,
    minHeight: 537,
  },
  heading: {
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    paddingBottom: 26,
    gap: 10,
  },
  restaurant: {
    fontSize: 12,
    lineHeight: 16.8,
    color: colors.forest,
    textAlign: 'center',
  },
  identity: { fontSize: 13, lineHeight: 18.2, textAlign: 'center' },
  lines: { flexGrow: 1, minHeight: 270, paddingTop: 24 },
  line: { marginBottom: 22 },
  item: { flex: 1 },
  amount: { color: colors.forest },
  quantity: { marginTop: 4 },
  totals: { borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 20 },
  grand: { marginTop: 24 },
  totalLabel: { fontSize: 17, lineHeight: 23.8 },
  total: { color: colors.forest, fontSize: 26, lineHeight: 36.4 },
  caption: { marginTop: 28, textAlign: 'center' },
  error: { color: colors.error, fontSize: 12, lineHeight: 18, marginTop: 12 },
});
