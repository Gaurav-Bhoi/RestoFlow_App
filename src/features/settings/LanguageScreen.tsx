import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import type { RootScreenProps } from '../../app/navigationTypes';
import { useFeedback } from '../../app/FeedbackProvider';
import { Screen } from '../../components/Screen';
import { AppHeader } from '../../components/AppHeader';
import { AppText } from '../../components/AppText';
import { AppButton } from '../../components/AppButton';
import { colors, fonts } from '../../theme/tokens';
import { useRestaurant } from '../restaurant/RestaurantProvider';
import type { Language } from '../restaurant/types';

const languages: { name: Language; native: string }[] = [
  { name: 'English', native: 'English' },
  { name: 'Hindi', native: 'हिन्दी' },
  { name: 'Marathi', native: 'मराठी' },
];
export function LanguageScreen({ navigation }: RootScreenProps<'Language'>) {
  const { restaurant, dispatch } = useRestaurant();
  const showFeedback = useFeedback();
  const [language, setLanguage] = useState(restaurant.language);
  const handleSave = () => {
    dispatch({ type: 'setLanguage', language });
    navigation.goBack();
    showFeedback('Language preference saved');
  };
  return (
    <Screen
      header={
        <AppHeader
          title="Language"
          subtitle="Choose what feels familiar."
          onBack={navigation.goBack}
        />
      }
      footer={<AppButton onPress={handleSave}>Save language</AppButton>}
    >
      <AppText muted variant="small" style={styles.description}>
        Navigation labels update after you save.{'\n'}This concept includes
        sample translations.
      </AppText>
      <View accessibilityRole="radiogroup">
        {languages.map(option => (
          <Pressable
            key={option.name}
            accessibilityRole="radio"
            accessibilityState={{ checked: option.name === language }}
            onPress={() => setLanguage(option.name)}
            style={[styles.option, option.name === language && styles.active]}
          >
            <View>
              <AppText style={styles.name}>{option.name}</AppText>
              <AppText
                muted
                style={[
                  styles.native,
                  option.name !== 'English' && styles.script,
                ]}
              >
                {option.native}
              </AppText>
            </View>
            <View
              style={[
                styles.radio,
                option.name === language && styles.selectedRadio,
              ]}
            >
              {option.name === language && <View style={styles.dot} />}
            </View>
          </Pressable>
        ))}
      </View>
    </Screen>
  );
}
const styles = StyleSheet.create({
  description: { marginTop: 8, marginBottom: 25 },
  option: {
    minHeight: 77,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    paddingVertical: 16,
    paddingHorizontal: 19,
    borderRadius: 23,
    marginBottom: 12,
  },
  active: { backgroundColor: colors.sage },
  name: { fontWeight: '700' },
  native: { fontSize: 11, lineHeight: 20 },
  script: { fontFamily: fonts.script },
  radio: {
    width: 23,
    height: 23,
    borderWidth: 1.5,
    borderColor: '#b7c3b4',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedRadio: { backgroundColor: colors.forest, borderColor: colors.forest },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.white },
});
