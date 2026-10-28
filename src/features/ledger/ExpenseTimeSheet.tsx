import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { BottomSheet } from '../../components/BottomSheet';
import { AppText } from '../../components/AppText';
import { AppInput } from '../../components/AppInput';
import { AppButton } from '../../components/AppButton';
import { colors } from '../../theme/tokens';
import { expenseControlStyles as controls } from './ExpenseControls';

export function ExpenseTimeSheet({
  value,
  onSelect,
  onClose,
}: {
  value: string;
  onSelect: (time: string) => void;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const [hours, minutes] = value.split(':').map(Number);
  const [hour, setHour] = useState(String(hours % 12 || 12));
  const [minute, setMinute] = useState(String(minutes).padStart(2, '0'));
  const [afternoon, setAfternoon] = useState(hours >= 12);
  const valid =
    /^\d{1,2}$/.test(hour) &&
    +hour >= 1 &&
    +hour <= 12 &&
    /^\d{1,2}$/.test(minute) &&
    +minute < 60;
  return (
    <BottomSheet
      visible
      title={t('ledger.selectTime')}
      onClose={onClose}
      footer={
        <AppButton
          disabled={!valid}
          onPress={() =>
            onSelect(
              `${String((+hour % 12) + (afternoon ? 12 : 0)).padStart(
                2,
                '0',
              )}:${minute.padStart(2, '0')}`,
            )
          }
        >
          {t('ledger.useTime')}
        </AppButton>
      }
    >
      <View style={controls.row}>
        <View style={controls.field}>
          <AppInput
            label={t('ledger.hour')}
            value={hour}
            onChangeText={setHour}
            keyboardType="number-pad"
            maxLength={2}
          />
        </View>
        <View style={controls.field}>
          <AppInput
            label={t('ledger.minute')}
            value={minute}
            onChangeText={setMinute}
            keyboardType="number-pad"
            maxLength={2}
          />
        </View>
      </View>
      <View accessibilityRole="radiogroup" style={styles.periods}>
        {[false, true].map(isAfternoon => (
          <Pressable
            key={String(isAfternoon)}
            accessibilityRole="radio"
            accessibilityState={{ selected: afternoon === isAfternoon }}
            style={[styles.period, afternoon === isAfternoon && styles.active]}
            onPress={() => setAfternoon(isAfternoon)}
          >
            <AppText style={afternoon === isAfternoon && styles.activeText}>
              {t(isAfternoon ? 'ledger.pm' : 'ledger.am')}
            </AppText>
          </Pressable>
        ))}
      </View>
    </BottomSheet>
  );
}
const styles = StyleSheet.create({
  periods: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  period: {
    flex: 1,
    minHeight: 44,
    padding: 12,
    borderRadius: 22,
    alignItems: 'center',
    backgroundColor: colors.sage,
  },
  active: { backgroundColor: colors.forest },
  activeText: { color: colors.white },
});
