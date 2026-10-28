import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { RootScreenProps } from '../../app/navigationTypes';
import { Screen } from '../../components/Screen';
import { AppHeader } from '../../components/AppHeader';
import { AppButton } from '../../components/AppButton';
import { AppText } from '../../components/AppText';
import { Icon } from '../../components/Icon';
import { colors } from '../../theme/tokens';
import { ledgerError, ledgerFiles, type ReceiptPreview } from './ledgerFiles';
import { expenseControlStyles as controls } from './ExpenseControls';

export function ExpenseReceiptScreen({
  route,
  navigation,
}: RootScreenProps<'ExpenseReceipt'>) {
  const { t } = useTranslation();
  const { receipt } = route.params;
  const [error, setError] = useState('');
  const [opening, setOpening] = useState(false);
  const [preview, setPreview] = useState<ReceiptPreview>();
  const [loading, setLoading] = useState(receipt.type === 'application/pdf');
  useEffect(() => {
    if (receipt.type !== 'application/pdf') return;
    let active = true;
    ledgerFiles.renderReceipt(receipt).then(
      value => {
        if (active) {
          setPreview(value);
          setLoading(false);
        }
      },
      cause => {
        if (active) {
          setError(ledgerError(cause, 'ledger.previewFailed'));
          setLoading(false);
        }
      },
    );
    return () => {
      active = false;
    };
  }, [receipt]);
  async function open() {
    if (opening) return;
    setOpening(true);
    setError('');
    try {
      await ledgerFiles.preview(receipt);
    } catch (cause) {
      setError(ledgerError(cause, 'ledger.previewFailed'));
    } finally {
      setOpening(false);
    }
  }
  return (
    <Screen
      header={
        <AppHeader
          title={t('ledger.receiptPreview')}
          subtitle={receipt.name}
          onBack={navigation.goBack}
        />
      }
      footer={
        <AppButton onPress={navigation.goBack}>
          {t('ledger.backToExpense')}
        </AppButton>
      }
    >
      {receipt.type.startsWith('image/') || preview ? (
        <Image
          source={{ uri: preview?.uri ?? receipt.uri }}
          resizeMode="contain"
          accessibilityLabel={receipt.name}
          style={[
            styles.image,
            preview && { aspectRatio: preview.aspectRatio },
          ]}
          onError={() => setError('ledger.previewFailed')}
        />
      ) : (
        <View style={styles.pdf}>
          {loading ? (
            <ActivityIndicator
              color={colors.forest}
              accessibilityLabel={t('ledger.previewReceipt')}
            />
          ) : (
            <Icon name="file" size={56} />
          )}
          <AppText style={styles.name}>{receipt.name}</AppText>
        </View>
      )}
      {preview && (
        <AppText muted variant="helper" style={styles.pageInfo}>
          {t('ledger.receiptPage', { count: preview.pages })}
        </AppText>
      )}
      {receipt.type === 'application/pdf' && !loading && (
        <AppButton
          icon="file"
          variant="ghost"
          onPress={() => {
            open();
          }}
          loading={opening}
        >
          {t('ledger.openReceipt')}
        </AppButton>
      )}
      {!!error && (
        <AppText accessibilityRole="alert" style={controls.error}>
          {t(error)}
        </AppText>
      )}
    </Screen>
  );
}
const styles = StyleSheet.create({
  image: {
    width: '100%',
    aspectRatio: 0.7,
    backgroundColor: colors.white,
    borderRadius: 22,
    marginTop: 24,
  },
  pdf: {
    backgroundColor: colors.white,
    borderRadius: 22,
    minHeight: 400,
    marginTop: 24,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 28,
  },
  name: { textAlign: 'center' },
  pageInfo: { textAlign: 'center', marginTop: 16 },
});
