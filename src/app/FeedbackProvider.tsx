import React, { createContext, useContext, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '../components/AppText';
import { Icon } from '../components/Icon';
import { colors } from '../theme/tokens';

const FeedbackContext = createContext<(message: string) => void>(() => {});
export function FeedbackProvider({ children }: React.PropsWithChildren) {
  const [message, setMessage] = useState('');
  const insets = useSafeAreaInsets();
  useEffect(() => {
    if (!message) {
      return;
    }
    const timeout = setTimeout(() => setMessage(''), 2600);
    return () => clearTimeout(timeout);
  }, [message]);
  return (
    <FeedbackContext.Provider value={setMessage}>
      {children}
      {!!message && (
        <View
          accessibilityLiveRegion="polite"
          pointerEvents="none"
          style={[styles.toast, { top: insets.top + 8 }]}
        >
          <Icon name="check" color={colors.white} size={18} />
          <AppText style={styles.text}>{message}</AppText>
        </View>
      )}
    </FeedbackContext.Provider>
  );
}
export const useFeedback = () => useContext(FeedbackContext);
const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    left: 22,
    right: 22,
    padding: 16,
    borderRadius: 20,
    backgroundColor: colors.forest,
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    zIndex: 100,
  },
  text: { color: colors.white, fontSize: 12, flex: 1 },
});
