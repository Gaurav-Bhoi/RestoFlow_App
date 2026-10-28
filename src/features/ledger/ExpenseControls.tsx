import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppText } from '../../components/AppText';
import { Icon, type IconName } from '../../components/Icon';
import { BottomSheet, BottomSheetContent } from '../../components/BottomSheet';
import { SheetOption } from '../../components/SheetOption';
import { colors, controlSizes, radius } from '../../theme/tokens';

export function LedgerIconButton({
  icon,
  label,
  onPress,
  disabled,
  selected,
}: {
  icon: IconName;
  label: string;
  onPress: () => void;
  disabled?: boolean;
  selected?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled, selected }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.iconButton,
        selected && styles.selectedIcon,
        (pressed || disabled) && styles.dimmed,
      ]}
    >
      <Icon
        name={icon}
        size={20}
        color={selected ? colors.white : colors.forest}
      />
    </Pressable>
  );
}

export function ExpenseSelect({
  label,
  value,
  onPress,
  icon = 'arrow',
  disabled,
}: {
  label: string;
  value: string;
  onPress?: () => void;
  icon?: IconName;
  disabled?: boolean;
}) {
  return (
    <View style={styles.group}>
      <AppText variant="label" muted style={styles.label}>
        {label}
      </AppText>
      <Pressable
        accessibilityRole={onPress ? 'button' : undefined}
        accessibilityLabel={`${label}: ${value}`}
        accessibilityState={{ disabled }}
        disabled={disabled || !onPress}
        onPress={onPress}
        style={({ pressed }) => [
          styles.select,
          pressed && styles.dimmed,
          disabled && styles.dimmed,
        ]}
      >
        <AppText style={styles.value}>{value}</AppText>
        <View style={icon === 'arrow' && styles.down}>
          <Icon name={icon} color={colors.muted} size={20} />
        </View>
      </Pressable>
    </View>
  );
}

export function ExpenseChoiceSheet<T extends string>({
  title,
  options,
  selected,
  visible,
  onSelect,
  onClose,
  embedded,
}: {
  title: string;
  options: readonly T[];
  selected?: T;
  visible: boolean;
  onSelect: (value: T) => void;
  onClose: () => void;
  embedded?: boolean;
}) {
  const { t } = useTranslation();
  const choices = (
    <View accessibilityRole="radiogroup" style={styles.options}>
      {options.map(value => (
        <SheetOption
          key={value}
          label={t(`ledger.options.${value}`)}
          selected={value === selected}
          plain
          trailing
          onPress={() => onSelect(value)}
        />
      ))}
    </View>
  );
  return embedded ? (
    <BottomSheetContent title={title} onClose={onClose}>
      {choices}
    </BottomSheetContent>
  ) : (
    <BottomSheet visible={visible} title={title} onClose={onClose}>
      {choices}
    </BottomSheet>
  );
}

export const expenseControlStyles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 14 },
  field: { flex: 1, minWidth: 0 },
  stacked: { flexDirection: 'column', gap: 0 },
  error: {
    color: colors.error,
    fontSize: 11,
    lineHeight: 15.4,
    marginBottom: 12,
  },
  inputLabel: { color: colors.muted, marginBottom: 5, lineHeight: 16.8 },
});

const styles = StyleSheet.create({
  group: { marginBottom: 21 },
  label: { marginBottom: 5, lineHeight: 16.8 },
  select: {
    minHeight: controlSizes.input,
    borderRadius: radius.field,
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  value: { flex: 1, minWidth: 0, fontSize: 14, lineHeight: 19.6 },
  down: { transform: [{ rotate: '90deg' }] },
  iconButton: {
    width: controlSizes.touch,
    height: controlSizes.touch,
    borderRadius: controlSizes.touch / 2,
    backgroundColor: colors.sage,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedIcon: { backgroundColor: colors.forest },
  dimmed: { opacity: 0.55 },
  options: { gap: 0, paddingBottom: 42 },
});
