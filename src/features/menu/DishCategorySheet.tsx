import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { BottomSheet } from '../../components/BottomSheet';
import { SheetOption } from '../../components/SheetOption';
import { dishCategories } from './menuConfig';

export function DishCategorySheet({
  visible,
  selected,
  onSelect,
  onClose,
}: {
  visible: boolean;
  selected: string;
  onSelect: (category: string) => void;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  return (
    <BottomSheet
      visible={visible}
      title={t('menu.dishCategory')}
      onClose={onClose}
    >
      <View accessibilityRole="radiogroup" style={styles.categories}>
        {Array.from(new Set<string>([...dishCategories, selected])).map(
          category => (
            <SheetOption
              key={category}
              label={t(`menu.categories.${category}`, {
                defaultValue: category,
              })}
              selected={selected === category}
              plain
              trailing
              onPress={() => onSelect(category)}
            />
          ),
        )}
      </View>
    </BottomSheet>
  );
}
const styles = StyleSheet.create({ categories: { gap: 3, paddingBottom: 50 } });
