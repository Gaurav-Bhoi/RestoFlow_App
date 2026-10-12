import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { RootScreenProps } from '../../app/navigationTypes';
import { useFeedback } from '../../app/FeedbackProvider';
import { Screen } from '../../components/Screen';
import { AppHeader } from '../../components/AppHeader';
import { AppText } from '../../components/AppText';
import { AppButton } from '../../components/AppButton';
import { colors } from '../../theme/tokens';
import {
  languageManager,
  useLanguage,
} from '../../localization/LocalizationProvider';

export function LanguageScreen({ navigation }: RootScreenProps<'Language'>) {
  const { t } = useTranslation();
  const state = useLanguage();
  const showFeedback = useFeedback();
  const [selected, setSelected] = useState(state.language);
  const [refreshing, setRefreshing] = useState(false);
  const refresh = async () => {
    setRefreshing(true);
    await languageManager.refreshLanguages();
    setRefreshing(false);
  };
  useEffect(() => {
    void refresh();
  }, []);
  const selectedOption = state.available.find(
    option => option.code === selected,
  );
  const handleSave = async () => {
    if (!selectedOption) return;
    const changed = await languageManager.changeLanguage(selected);
    if (!changed) {
      showFeedback(
        t('common.languageDownloadError', { name: selectedOption.nativeName }),
      );
      return;
    }
    const saved = languageManager.getSnapshot();
    showFeedback(
      t(
        saved.restartRequired
          ? 'common.restartRequired'
          : 'common.languageSaved',
      ),
    );
    navigation.goBack();
  };
  return (
    <Screen
      header={
        <AppHeader
          title={t('common.language')}
          subtitle={t('common.languageSubtitle')}
          onBack={navigation.goBack}
        />
      }
      footer={
        <AppButton
          disabled={!!state.loading || !selectedOption}
          onPress={handleSave}
        >
          {t('common.saveLanguage')}
        </AppButton>
      }
    >
      <AppText muted variant="small" style={styles.description}>
        {t('common.languageDescription')}
      </AppText>
      {!!state.loading && (
        <View accessibilityLiveRegion="polite" style={styles.progress}>
          <ActivityIndicator color={colors.forest} />
          <AppText>
            {t('common.preparingLanguage', {
              name: selectedOption?.nativeName ?? selected,
            })}
          </AppText>
        </View>
      )}
      {state.error === 'languages' && (
        <View style={styles.progress}>
          <AppText muted style={styles.message}>
            {t('common.languagesUnavailable')}
          </AppText>
          <AppButton variant="ghost" disabled={refreshing} onPress={refresh}>
            {t('common.retry')}
          </AppButton>
        </View>
      )}
      {refreshing && <ActivityIndicator color={colors.forest} />}
      {state.restartRequired && (
        <AppText accessibilityRole="alert">
          {t('common.restartRequired')}
        </AppText>
      )}
      <View accessibilityRole="radiogroup">
        {state.available.map(option => (
          <Pressable
            key={option.code}
            accessibilityRole="radio"
            accessibilityState={{
              checked: option.code === selected,
              disabled: !!state.loading,
            }}
            disabled={!!state.loading}
            onPress={() => setSelected(option.code)}
            style={[styles.option, option.code === selected && styles.active]}
          >
            <View>
              <AppText style={styles.name}>{option.nativeName}</AppText>
              {option.nativeName !== option.name && (
                <AppText muted style={styles.englishName}>
                  {option.name}
                </AppText>
              )}
            </View>
            <View
              style={[
                styles.radio,
                option.code === selected && styles.selectedRadio,
              ]}
            >
              {option.code === selected && <View style={styles.dot} />}
            </View>
          </Pressable>
        ))}
      </View>
    </Screen>
  );
}
const styles = StyleSheet.create({
  description: { marginTop: 8, marginBottom: 25 },
  progress: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  message: { flex: 1 },
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
  englishName: { fontSize: 11, lineHeight: 20 },
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
