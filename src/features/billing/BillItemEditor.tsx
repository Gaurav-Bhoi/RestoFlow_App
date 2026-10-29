import React, { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { BillLine } from '../../api/billing';
import { BottomSheet } from '../../components/BottomSheet';
import { AppText } from '../../components/AppText';
import { AppInput } from '../../components/AppInput';
import { AppButton } from '../../components/AppButton';
import { Icon } from '../../components/Icon';
import { colors, fonts } from '../../theme/tokens';
import { formatCurrency } from '../../utils/currency';
import { normalizePrice } from './billDraft';
import { paiseMoney, pricePaise } from '../orders/orderCalculations';

export type BillField = 'name' | 'quantity' | 'unitPrice';
export function BillItemEditor({
  line,
  field,
  onClose,
  onApply,
}: {
  line: BillLine;
  field: BillField;
  onClose: () => void;
  onApply: (line: BillLine) => void;
}) {
  const { t } = useTranslation();
  const [value, setValue] = useState(String(line[field]));
  const quantity = /^\d+$/.test(value) ? Number(value) : 0;
  const validQuantity =
    Number.isInteger(quantity) && quantity >= 1 && quantity <= 10000;
  const price = field === 'unitPrice' ? normalizePrice(value) : null;
  const valid =
    field === 'quantity'
      ? validQuantity
      : field === 'unitPrice'
      ? price !== null
      : !!value.trim() && value.trim().length <= 120;
  const changed =
    field === 'quantity'
      ? quantity !== line.quantity
      : field === 'unitPrice'
      ? price !== line.unitPrice
      : value.trim() !== line.name;
  function apply() {
    if (!valid || !changed) return;
    onApply({
      ...line,
      [field]:
        field === 'quantity'
          ? quantity
          : field === 'unitPrice'
          ? price!
          : value.trim(),
    });
  }
  return (
    <BottomSheet
      visible
      title={t(`billing.edit_${field}`)}
      onClose={onClose}
      footer={
        <AppButton wrapLabel disabled={!valid || !changed} onPress={apply}>
          {t(
            field === 'quantity'
              ? 'billing.applyQuantity'
              : 'billing.applyChange',
          )}
        </AppButton>
      }
    >
      <View style={styles.body}>
        {field === 'quantity' ? (
          <>
            <AppText style={styles.dish}>{line.name}</AppText>
            <AppText muted variant="small">
              {t('billing.minimumQuantity')}
            </AppText>
            <View style={styles.stepper}>
              <Pressable
                disabled={quantity <= 1}
                accessibilityRole="button"
                accessibilityLabel={t('billing.decreaseQuantity')}
                accessibilityState={{ disabled: quantity <= 1 }}
                onPress={() => setValue(String(quantity - 1))}
                style={[styles.step, quantity <= 1 && styles.dimmed]}
              >
                <Icon name="minus" size={20} />
              </Pressable>
              <TextInput
                accessibilityLabel={t('billing.quantity')}
                keyboardType="number-pad"
                selectTextOnFocus
                maxFontSizeMultiplier={1.5}
                value={value}
                onChangeText={setValue}
                maxLength={6}
                style={[styles.quantity, !validQuantity && styles.error]}
              />
              <Pressable
                disabled={quantity >= 10000}
                accessibilityRole="button"
                accessibilityLabel={t('billing.increaseQuantity')}
                accessibilityState={{ disabled: quantity >= 10000 }}
                onPress={() => setValue(String(quantity + 1))}
                style={[styles.step, quantity >= 10000 && styles.dimmed]}
              >
                <Icon name="plus" size={20} />
              </Pressable>
            </View>
            <AppText
              accessibilityLiveRegion="polite"
              style={!validQuantity && styles.error}
              variant="small"
            >
              {validQuantity
                ? `${quantity} × ${formatCurrency(
                    line.unitPrice,
                  )} = ${formatCurrency(
                    paiseMoney(pricePaise(line.unitPrice) * BigInt(quantity)),
                  )}`
                : t(
                    quantity > 10000
                      ? 'billing.quantityTooLarge'
                      : 'billing.invalidQuantity',
                  )}
            </AppText>
          </>
        ) : (
          <>
            <AppInput
              label={t(
                field === 'name' ? 'billing.itemName' : 'billing.unitPrice',
              )}
              autoFocus
              value={value}
              onChangeText={setValue}
              maxLength={field === 'name' ? 120 : 20}
              keyboardType={field === 'unitPrice' ? 'decimal-pad' : 'default'}
              error={
                !valid
                  ? t(
                      field === 'name'
                        ? 'billing.invalidName'
                        : 'billing.invalidPrice',
                    )
                  : undefined
              }
              onSubmitEditing={apply}
            />
            <AppText muted variant="small">
              {t('billing.billOnlyChanges')}
            </AppText>
          </>
        )}
      </View>
    </BottomSheet>
  );
}
const styles = StyleSheet.create({
  body: { minHeight: 178, paddingBottom: 28 },
  dish: { fontSize: 16, marginBottom: 8 },
  stepper: {
    width: 232,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    padding: 8,
    marginTop: 28,
    marginBottom: 18,
  },
  step: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.sage,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantity: {
    flex: 1,
    textAlign: 'center',
    fontFamily: fonts.body,
    fontSize: 22,
    color: colors.forest,
    padding: 0,
    includeFontPadding: false,
  },
  dimmed: { opacity: 0.4 },
  error: { color: colors.error },
});
