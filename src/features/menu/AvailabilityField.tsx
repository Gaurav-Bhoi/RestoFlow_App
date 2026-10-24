import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppText } from '../../components/AppText';
import { ToggleSwitch } from '../../components/ToggleSwitch';

export function AvailabilityField({
  value,
  onChange,
  disabled,
}: {
  value: boolean;
  onChange: (available: boolean) => void;
  disabled?: boolean;
}) {
  const { t } = useTranslation();
  return (
    <View style={styles.row}>
      <View style={styles.copy}>
        <AppText>{t(value ? 'menu.available' : 'menu.unavailable')}</AppText>
        <AppText muted variant="helper" style={styles.helper}>
          {t('menu.shownToStaff')}
        </AppText>
      </View>
      <ToggleSwitch
        label={t('menu.available')}
        value={value}
        onChange={onChange}
        disabled={disabled}
      />
    </View>
  );
}
const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    marginTop: 4,
    marginBottom: 8,
    minHeight: 50,
  },
  copy: { flex: 1 },
  helper: { marginTop: 3 },
});
