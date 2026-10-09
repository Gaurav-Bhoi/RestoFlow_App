import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet } from 'react-native';
import { colors, motion } from '../theme/tokens';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { AppText } from './AppText';
import { Icon } from './Icon';

export function SuccessState({
  title,
  description,
  children,
}: React.PropsWithChildren<{ title: string; description: string }>) {
  const scale = useRef(new Animated.Value(0.8)).current;
  const isReducedMotion = useReducedMotion();
  useEffect(() => {
    Animated.timing(scale, {
      toValue: 1,
      duration: isReducedMotion ? 0 : motion.confirmation,
      useNativeDriver: true,
    }).start();
  }, [isReducedMotion, scale]);
  return (
    <Animated.View style={styles.success}>
      <Animated.View style={[styles.ring, { transform: [{ scale }] }]}>
        <Icon name="check" size={45} />
      </Animated.View>
      <AppText variant="heading" style={styles.title}>
        {title}
      </AppText>
      <AppText muted style={styles.copy}>
        {description}
      </AppText>
      {children}
    </Animated.View>
  );
}
const styles = StyleSheet.create({
  success: { alignItems: 'center', paddingTop: 115 },
  ring: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: colors.sage,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 29,
  },
  title: { textAlign: 'center', marginBottom: 11 },
  copy: {
    fontSize: 13,
    lineHeight: 22,
    textAlign: 'center',
    maxWidth: 290,
    marginBottom: 25,
  },
});
