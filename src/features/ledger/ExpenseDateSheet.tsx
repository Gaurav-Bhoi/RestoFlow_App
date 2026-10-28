import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { BottomSheet, BottomSheetContent } from '../../components/BottomSheet';
import { AppButton } from '../../components/AppButton';
import { AppText } from '../../components/AppText';
import { Icon } from '../../components/Icon';
import { colors } from '../../theme/tokens';
import { dateKey, localDate } from './expenseCalculations';

export function ExpenseDateSheet({
  title,
  value,
  onSelect,
  onClose,
  embedded,
}: {
  title: string;
  value: string;
  onSelect: (date: string) => void;
  onClose: () => void;
  embedded?: boolean;
}) {
  const { t, i18n } = useTranslation();
  const [selected, setSelected] = useState(value);
  const [month, setMonth] = useState(() => localDate(value));
  const monthStart = new Date(month.getFullYear(), month.getMonth(), 1, 12);
  const offset = (monthStart.getDay() + 6) % 7;
  const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cells = Math.ceil((offset + days) / 7) * 7;
  const moveMonth = (delta: number) =>
    setMonth(new Date(month.getFullYear(), month.getMonth() + delta, 1, 12));
  const footer = (
    <AppButton onPress={() => onSelect(selected)}>
      {t('ledger.useDate')}
    </AppButton>
  );
  const calendar = (
    <>
      <View style={styles.month}>
        <AppText style={styles.monthTitle}>
          {month.toLocaleDateString(i18n.language, {
            month: 'long',
            year: 'numeric',
          })}
        </AppText>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('ledger.previousMonth')}
          onPress={() => moveMonth(-1)}
          style={styles.arrow}
        >
          <Icon name="back" size={20} />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('ledger.nextMonth')}
          onPress={() => moveMonth(1)}
          style={styles.arrow}
        >
          <Icon name="arrow" size={20} />
        </Pressable>
      </View>
      <View style={styles.grid}>
        {Array.from({ length: 7 }, (_, index) => (
          <View key={`weekday-${index}`} style={styles.cell}>
            <AppText variant="helper" muted>
              {new Date(2026, 9, 5 + index).toLocaleDateString(i18n.language, {
                weekday: 'narrow',
              })}
            </AppText>
          </View>
        ))}
        {Array.from({ length: cells }, (_, index) => {
          const day = index - offset + 1;
          if (day < 1 || day > days)
            return <View key={index} style={styles.cell} />;
          const date = dateKey(
            new Date(month.getFullYear(), month.getMonth(), day, 12),
          );
          const active = selected === date;
          return (
            <View key={date} style={styles.cell}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={localDate(date).toLocaleDateString(
                  i18n.language,
                  { dateStyle: 'full' },
                )}
                accessibilityState={{ selected: active }}
                onPress={() => setSelected(date)}
                style={[styles.day, active && styles.active]}
              >
                <AppText style={active && styles.activeText}>{day}</AppText>
              </Pressable>
            </View>
          );
        })}
      </View>
    </>
  );
  return embedded ? (
    <BottomSheetContent title={title} onClose={onClose} footer={footer}>
      {calendar}
    </BottomSheetContent>
  ) : (
    <BottomSheet visible title={title} onClose={onClose} footer={footer}>
      {calendar}
    </BottomSheet>
  );
}
const styles = StyleSheet.create({
  month: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  monthTitle: { flex: 1, fontSize: 18, lineHeight: 25.2 },
  arrow: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingBottom: 24 },
  cell: {
    // Leave a rounding margin so Yoga keeps all seven columns on one row.
    width: '14.28%',
    minHeight: 49,
    justifyContent: 'center',
    alignItems: 'center',
  },
  day: {
    width: '100%',
    maxWidth: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  active: { backgroundColor: colors.forest },
  activeText: { color: colors.white },
});
