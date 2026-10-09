import React from 'react';
import { StyleSheet, View } from 'react-native';
import type { RootScreenProps } from '../../app/navigationTypes';
import { Screen } from '../../components/Screen';
import { AppHeader } from '../../components/AppHeader';
import { AppButton } from '../../components/AppButton';
import { AppText } from '../../components/AppText';
import { Avatar } from '../../components/Avatar';
import { Badge } from '../../components/Badge';
import { EmptyState } from '../../components/EmptyState';
import { Notice } from '../../components/Notice';
import { colors } from '../../theme/tokens';
import { useWaiters } from './useWaiters';

export function WaitersScreen({ navigation }: RootScreenProps<'Waiters'>) {
  const { waiters } = useWaiters();
  return (
    <Screen
      header={
        <AppHeader
          title="Your waiter team"
          subtitle="Good service starts with good people."
          onBack={navigation.goBack}
        />
      }
      footer={
        <AppButton icon="plus" onPress={() => navigation.navigate('AddWaiter')}>
          Add waiter
        </AppButton>
      }
    >
      {waiters.length ? (
        <>
          <AppText variant="section" style={styles.heading}>
            {waiters.length} team members
          </AppText>
          {waiters.map(waiter => (
            <View key={waiter.phone} style={styles.waiter}>
              <Avatar name={waiter.name} photo={waiter.photo} size={50} />
              <View style={styles.details}>
                <AppText style={styles.name}>{waiter.name}</AppText>
                <AppText muted variant="small">
                  +91 {waiter.phone}
                </AppText>
              </View>
              <Badge>Waiter</Badge>
            </View>
          ))}
          <View style={styles.notice}>
            <Notice icon="shield">
              Waiters use their mobile number to join your restaurant’s floor.
            </Notice>
          </View>
        </>
      ) : (
        <EmptyState
          title="Build your floor team"
          description="Add your first waiter. Their mobile number will connect them to your restaurant."
          icon="people"
        />
      )}
    </Screen>
  );
}
const styles = StyleSheet.create({
  heading: { marginTop: 4, marginBottom: 16 },
  waiter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    backgroundColor: colors.white,
    borderRadius: 25,
    padding: 18,
    marginBottom: 13,
  },
  details: { flex: 1 },
  name: { fontSize: 15, fontWeight: '700', marginBottom: 4 },
  notice: { marginTop: 18 },
});
