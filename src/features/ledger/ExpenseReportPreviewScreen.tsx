import React, { useCallback, useRef, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import RNPrint from 'react-native-print';
import type { RootScreenProps } from '../../app/navigationTypes';
import { AppHeader } from '../../components/AppHeader';
import { Screen } from '../../components/Screen';
import { AppText } from '../../components/AppText';
import { AppButton } from '../../components/AppButton';
import { BottomSheet } from '../../components/BottomSheet';
import { SheetOption } from '../../components/SheetOption';
import { colors } from '../../theme/tokens';
import { useResponsiveLayout } from '../../hooks/useResponsiveLayout';
import {
  LedgerIconButton,
  expenseControlStyles as controls,
} from './ExpenseControls';
import { LedgerNotice } from './LedgerNotice';
import { ledgerError, ledgerFiles } from './ledgerFiles';
import { reportText } from './expenseReport';

export function ExpenseReportPreviewScreen({
  route,
  navigation,
}: RootScreenProps<'ExpenseReportPreview'>) {
  const { t } = useTranslation();
  const { document, uri } = route.params;
  const [sharing, setSharing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const pending = useRef(false);
  const { contentWidth, fontScale } = useResponsiveLayout();
  const narrow = contentWidth < 300 || fontScale > 1.3;
  const dismissNotice = useCallback(() => setNotice(''), []);
  async function act(action: 'save' | 'print' | 'copy' | 'whatsapp' | 'email') {
    if (pending.current) return;
    pending.current = true;
    setBusy(true);
    setError('');
    try {
      if (action === 'save') {
        if (await ledgerFiles.savePdf(uri, 'RestoFlow-Expense-Report.pdf'))
          setNotice('ledger.pdfSaved');
      } else if (action === 'print')
        await RNPrint.print({
          filePath: uri.replace(/^file:\/\//, ''),
          jobName: document.title,
        });
      else if (action === 'copy') {
        await ledgerFiles.copyText(reportText(document));
        setNotice('ledger.reportCopied');
      } else
        await ledgerFiles.sharePdf(uri, 'RestoFlow-Expense-Report.pdf', action);
      setSharing(false);
    } catch (cause) {
      setError(ledgerError(cause));
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }
  return (
    <>
      <Screen
        scrollable={false}
        header={
          <AppHeader
            title={t('ledger.pdfPreview')}
            subtitle={t('ledger.previewSubtitle')}
            onBack={navigation.goBack}
            right={
              <LedgerIconButton
                icon="share"
                label={t('ledger.shareReport')}
                disabled={busy}
                onPress={() => setSharing(true)}
              />
            }
          />
        }
        footer={
          <>
            {!!error && (
              <AppText accessibilityRole="alert" style={controls.error}>
                {t(error)}
              </AppText>
            )}
            <View style={[controls.row, narrow && controls.stacked]}>
              <AppButton
                icon="download"
                disabled={busy}
                onPress={() => {
                  act('save');
                }}
                style={styles.download}
                wrapLabel
              >
                {t('ledger.downloadPdf')}
              </AppButton>
              <AppButton
                variant="ghost"
                icon="print"
                disabled={busy}
                onPress={() => {
                  act('print');
                }}
                style={controls.field}
              >
                {t('ledger.print')}
              </AppButton>
            </View>
          </>
        }
      >
        <FlatList
          data={document.rows}
          keyExtractor={(_row, index) => String(index)}
          showsVerticalScrollIndicator={false}
          initialNumToRender={12}
          contentContainerStyle={styles.reportContent}
          ListHeaderComponent={
            <View style={styles.paperHeader}>
              <AppText style={styles.brand}>RestoFlow</AppText>
              <AppText variant="small" muted>
                {document.restaurant}
              </AppText>
              <AppText style={styles.reportTitle}>{document.title}</AppText>
              <AppText variant="helper" muted>
                {document.period}
              </AppText>
              <AppText style={styles.generated} muted>
                {document.generated}
              </AppText>
              <View style={styles.rule} />
              {!document.rows.length && (
                <AppText muted variant="small" style={styles.noRows}>
                  {t('ledger.noReportExpenses')}
                </AppText>
              )}
              <View style={styles.tableRow}>
                {document.columns.map((column, index) => (
                  <AppText
                    key={index}
                    muted
                    style={[
                      styles.tableText,
                      styles.cell,
                      columnStyle(index, narrow),
                    ]}
                  >
                    {column}
                  </AppText>
                ))}
              </View>
            </View>
          }
          renderItem={({ item: row }) => (
            <View style={[styles.tableRow, styles.paperRow]}>
              {row.map((cell, column) => (
                <AppText
                  key={column}
                  style={[
                    styles.tableText,
                    styles.cell,
                    columnStyle(column, narrow),
                  ]}
                >
                  {cell}
                </AppText>
              ))}
            </View>
          )}
          ListFooterComponent={
            <>
              <View style={styles.paperFooter}>
                <View style={[styles.rule, styles.totalsRule]} />
                {document.totals.map(([label, value], index) => (
                  <View key={label} style={styles.totalRow}>
                    <AppText
                      muted={index < 2}
                      style={[
                        controls.field,
                        index === 2 ? styles.grandLabel : styles.totalLabel,
                      ]}
                    >
                      {label}
                    </AppText>
                    <AppText
                      style={
                        index === 2 ? styles.grandAmount : styles.totalAmount
                      }
                    >
                      {value}
                    </AppText>
                  </View>
                ))}
              </View>
              <AppText muted variant="helper" style={styles.pageInfo}>
                {t('ledger.a4Report')}
              </AppText>
            </>
          }
        />
      </Screen>
      <BottomSheet
        visible={sharing}
        title={t('ledger.shareReport')}
        onClose={() => {
          if (!busy) setSharing(false);
        }}
      >
        {(['whatsapp', 'email', 'save', 'copy'] as const).map(action => (
          <SheetOption
            key={action}
            label={t(`ledger.share.${action}`)}
            plain
            trailing
            disabled={busy}
            onPress={() => {
              act(action);
            }}
          />
        ))}
        {!!error && (
          <AppText accessibilityRole="alert" style={controls.error}>
            {t(error)}
          </AppText>
        )}
      </BottomSheet>
      <LedgerNotice message={notice} onDismiss={dismissNotice} />
    </>
  );
}
const columnStyle = (index: number, narrow: boolean) =>
  [styles.date, styles.expense, styles.category, styles.amount][index] ??
  (narrow ? styles.expense : styles.cell);
const styles = StyleSheet.create({
  reportContent: { paddingTop: 8, paddingBottom: 16 },
  paperHeader: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    backgroundColor: colors.white,
    paddingHorizontal: 18,
    paddingTop: 15,
  },
  paperRow: { backgroundColor: colors.white, paddingHorizontal: 18 },
  paperFooter: {
    backgroundColor: colors.white,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    paddingHorizontal: 18,
    paddingBottom: 14,
  },
  brand: { fontSize: 20, lineHeight: 28, color: colors.forest },
  reportTitle: {
    fontSize: 17,
    lineHeight: 23.8,
    marginTop: 8,
    marginBottom: 4,
  },
  generated: { fontSize: 10, lineHeight: 14, marginTop: 3 },
  rule: {
    height: 1,
    backgroundColor: colors.line,
    marginTop: 14,
    marginBottom: 8,
  },
  tableRow: {
    flexDirection: 'row',
    gap: 6,
    paddingVertical: 7,
    alignItems: 'flex-start',
  },
  cell: { minWidth: 0 },
  date: { flex: 0.8 },
  expense: { flex: 2.5 },
  category: { flex: 1.3 },
  amount: { flex: 1.5, textAlign: 'right' },
  tableText: { fontSize: 10, lineHeight: 14 },
  totalsRule: { marginTop: 28, marginBottom: 10 },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 14,
    paddingVertical: 4,
  },
  totalLabel: { fontSize: 11, lineHeight: 15.4 },
  totalAmount: { fontSize: 11, lineHeight: 15.4, flexShrink: 1 },
  grandLabel: { fontSize: 13, lineHeight: 18.2, color: colors.forest },
  grandAmount: {
    color: colors.forest,
    fontSize: 14,
    lineHeight: 19.6,
    flexShrink: 1,
  },
  pageInfo: { textAlign: 'center', marginTop: 16 },
  download: { flex: 2 },
  noRows: { paddingVertical: 16 },
});
