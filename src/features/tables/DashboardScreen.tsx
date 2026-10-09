import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import {
  useAppNavigation,
  type HomeTabsParams,
} from '../../app/navigationTypes';
import { AppHeader } from '../../components/AppHeader';
import { AppText } from '../../components/AppText';
import { AppButton } from '../../components/AppButton';
import { Avatar } from '../../components/Avatar';
import { Badge } from '../../components/Badge';
import { ConfirmationSheet } from '../../components/ConfirmationSheet';
import { FilterChips } from '../../components/FilterChips';
import { EmptyState } from '../../components/EmptyState';
import { Screen } from '../../components/Screen';
import { colors, layout } from '../../theme/tokens';
import { useSession } from '../auth/SessionProvider';
import { useTranslations } from '../settings/translations';
import { FloorSummary } from './FloorSummary';
import { TableTile } from './TableTile';
import { useTables, type TableFilter } from './useTables';

export function DashboardScreen({
  navigation: tabNavigation,
}: BottomTabScreenProps<HomeTabsParams, 'Dashboard'>) {
  const navigation = useAppNavigation();
  const { session } = useSession();
  const labels = useTranslations();
  const tables = useTables();
  const filters: { value: TableFilter; label: string }[] = [
    {
      value: 'All tables',
      label: `All tables · ${tables.restaurant.tables.length}`,
    },
    { value: 'Available', label: 'Available' },
    { value: 'Occupied', label: 'Occupied' },
  ];
  return (
    <>
      <Screen
        hasTabs
        header={
          <AppHeader
            title="Today’s floor"
            subtitle={tables.restaurant.name}
            right={
              <Pressable
                onPress={() => tabNavigation.navigate('Settings')}
                accessibilityRole="button"
                accessibilityLabel="Open account settings"
              >
                <Avatar name={session?.name ?? ''} photo={session?.photo} />
              </Pressable>
            }
          />
        }
      >
        <FloorSummary
          occupied={tables.occupiedCount}
          tables={tables.restaurant.tables.length}
          guests={tables.guestCount}
        />
        <View style={layout.section}>
          <AppText variant="section">{labels.tables}</AppText>
          {tables.canManage ? (
            <Pressable
              onPress={() => tables.setIsEditing(!tables.isEditing)}
              accessibilityRole="button"
              style={styles.manage}
            >
              <AppText style={styles.manageLabel}>
                {tables.isEditing ? 'Done' : 'Manage'}
              </AppText>
            </Pressable>
          ) : (
            <Badge>Waiter</Badge>
          )}
        </View>
        {!tables.restaurant.tables.length ? (
          <EmptyState
            title="Your floor starts here"
            description="Add your restaurant tables and you’re ready to welcome the first guests."
            action={
              tables.canManage
                ? { label: 'Add first table', onPress: tables.addTable }
                : undefined
            }
          />
        ) : (
          <>
            <FilterChips
              options={filters}
              selected={tables.filter}
              onSelect={tables.setFilter}
              style={styles.filters}
            />
            <View style={styles.grid}>
              {tables.visibleTables.map(table => (
                <TableTile
                  key={table.id}
                  table={table}
                  onPress={() =>
                    navigation.navigate('Customers', { tableId: table.id })
                  }
                  onRemove={
                    tables.canManage &&
                    tables.isEditing &&
                    !table.customers.length
                      ? () => tables.setTableToRemove(table.id)
                      : undefined
                  }
                />
              ))}
            </View>
            {!tables.visibleTables.length && (
              <AppText muted style={styles.empty}>
                No tables with this status.
              </AppText>
            )}
            {tables.canManage && (
              <AppButton
                onPress={tables.addTable}
                icon="plus"
                variant="secondary"
                style={styles.add}
              >
                Add table
              </AppButton>
            )}
          </>
        )}
      </Screen>
      <ConfirmationSheet
        visible={tables.tableToRemove !== null}
        title="Remove this table?"
        description="This table is currently available. Existing occupied tables cannot be removed."
        icon="table"
        confirmLabel="Remove table"
        cancelLabel="Keep table"
        onConfirm={tables.removeTable}
        onCancel={() => tables.setTableToRemove(null)}
      />
    </>
  );
}
const styles = StyleSheet.create({
  filters: { marginTop: 4 },
  manage: { minHeight: 44, justifyContent: 'center' },
  manageLabel: { fontSize: 12, fontWeight: '700', color: colors.forest },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 16,
  },
  add: { marginTop: 18 },
  empty: { paddingVertical: 32, textAlign: 'center' },
});
