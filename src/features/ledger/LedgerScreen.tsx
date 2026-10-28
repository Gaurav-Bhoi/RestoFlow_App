import React, { useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useAppNavigation } from '../../app/navigationTypes';
import { Screen } from '../../components/Screen';
import { AppHeader } from '../../components/AppHeader';
import { AppInput } from '../../components/AppInput';
import { AppText } from '../../components/AppText';
import { AppButton } from '../../components/AppButton';
import { EmptyState } from '../../components/EmptyState';
import { Icon } from '../../components/Icon';
import { colors, navigationLayout } from '../../theme/tokens';
import { WorkspaceHeader } from '../menu/WorkspaceHeader';
import { WorkspaceSheet } from '../menu/WorkspaceSheet';
import { useLedger } from './LedgerProvider';
import { ExpenseRow } from './ExpenseRow';
import { LedgerSummary } from './LedgerSummary';
import { LedgerNotice } from './LedgerNotice';
import { LedgerIconButton } from './ExpenseControls';
import { ExpenseDateSheet } from './ExpenseDateSheet';
import { ExpenseFiltersSheet } from './ExpenseFiltersSheet';
import {
  dateKey,
  defaultExpenseFilters,
  filterExpenses,
} from './expenseCalculations';
import type { ExpenseFilters } from './types';

export function LedgerScreen({ onMenu }: { onMenu: () => void }) {
  const { t } = useTranslation();
  const navigation = useAppNavigation();
  const ledger = useLedger();
  const insets = useSafeAreaInsets();
  const [filters, setFilters] = useState<ExpenseFilters>(defaultExpenseFilters);
  const [search, setSearch] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [sheet, setSheet] = useState<'workspace' | 'filters' | 'date' | null>(
    null,
  );
  const now = new Date();
  // Search also recognizes translated category and subcategory labels.
  const query = search.trim().toLocaleLowerCase();
  const matching = ledger.expenses.filter(
    expense =>
      !query ||
      [
        expense.name,
        expense.notes,
        expense.vendor,
        t(`ledger.options.${expense.category}`),
        t(`ledger.options.${expense.subcategory}`),
      ].some(value => value.toLocaleLowerCase().includes(query)),
  );
  const visible = filterExpenses(matching, filters, '', now);
  const isEmpty = ledger.expenses.length === 0;
  const clear = () => {
    setSearch('');
    setFilters(defaultExpenseFilters());
  };
  const addExpense = () => navigation.navigate('ExpenseForm', {});
  const updatePeriod = (period: ExpenseFilters['period']) =>
    setFilters(current => ({ ...current, period }));
  const listHeader = searchOpen ? (
    <>
      <AppInput
        label={t('ledger.searchExpenses')}
        value={search}
        onChangeText={setSearch}
        autoFocus
        autoCorrect={false}
        placeholder={t('ledger.searchExpenses')}
        returnKeyType="search"
        right={
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('ledger.clearSearch')}
            onPress={() => setSearch('')}
            style={styles.clear}
          >
            <Icon name="close" size={20} color={colors.muted} />
          </Pressable>
        }
      />
      <AppText variant="label" muted style={styles.matchCount}>
        {t('ledger.matchCount', { count: visible.length })}
      </AppText>
    </>
  ) : (
    !isEmpty && (
      <>
        <LedgerSummary
          expenses={matching}
          visible={visible}
          filters={filters}
          now={now}
        />
        <View style={styles.periods}>
          {(['today', 'thisWeek', 'thisMonth'] as const).map((value, index) => (
            <Pressable
              key={value}
              accessibilityRole="tab"
              accessibilityState={{ selected: filters.period === value }}
              onPress={() => updatePeriod(value)}
              style={[styles.period, filters.period === value && styles.active]}
            >
              <AppText
                style={[
                  styles.tabText,
                  filters.period === value && styles.activeText,
                ]}
              >
                {t(`ledger.${['daily', 'weekly', 'monthly'][index]}`)}
              </AppText>
            </Pressable>
          ))}
          <LedgerIconButton
            icon="calendar"
            label={t('ledger.selectDate')}
            onPress={() => setSheet('date')}
          />
        </View>
        <View style={styles.searchRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('ledger.searchExpenses')}
            onPress={() => setSearchOpen(true)}
            style={styles.search}
          >
            <Icon name="search" size={18} color={colors.muted} />
            <AppText muted style={styles.searchLabel}>
              {search || t('ledger.searchExpenses')}
            </AppText>
          </Pressable>
          <LedgerIconButton
            icon="filter"
            label={t('ledger.filterExpenses')}
            onPress={() => setSheet('filters')}
            selected={
              filters.payment !== 'all' ||
              !!filters.min ||
              !!filters.max ||
              filters.period === 'custom'
            }
          />
        </View>
        <View style={styles.categories}>
          {(['all', 'inventory', 'miscellaneous'] as const).map(value => (
            <Pressable
              key={value}
              accessibilityRole="tab"
              accessibilityState={{ selected: filters.category === value }}
              onPress={() =>
                setFilters(current => ({ ...current, category: value }))
              }
              style={[
                styles.category,
                filters.category === value && styles.active,
              ]}
            >
              <AppText
                style={[
                  styles.tabText,
                  filters.category === value && styles.activeText,
                ]}
              >
                {t(`ledger.options.${value}`)}
              </AppText>
            </Pressable>
          ))}
        </View>
      </>
    )
  );
  return (
    <>
      <Screen
        hasTabs
        scrollable={false}
        header={
          searchOpen ? (
            <AppHeader
              title={t('menu.ledger')}
              subtitle={t('ledger.searchSubtitle')}
              onBack={() => setSearchOpen(false)}
            />
          ) : (
            <WorkspaceHeader
              workspace="ledger"
              onSwitch={() => setSheet('workspace')}
              right={
                !isEmpty && (
                  <LedgerIconButton
                    icon="download"
                    label={t('ledger.exportReport')}
                    onPress={() => navigation.navigate('ExpenseReport')}
                  />
                )
              }
            />
          )
        }
      >
        {ledger.error ? (
          <EmptyState
            title={t(ledger.error)}
            description={t('ledger.loadHint')}
            action={{ label: t('api.retry'), onPress: ledger.reload }}
          />
        ) : (
          <FlatList
            data={visible}
            keyExtractor={expense => expense.id}
            ListHeaderComponent={listHeader || undefined}
            renderItem={({ item }) => (
              <ExpenseRow
                expense={item}
                onPress={() =>
                  navigation.navigate('ExpenseDetails', { expenseId: item.id })
                }
              />
            )}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[
              styles.list,
              { paddingBottom: insets.bottom + navigationLayout.height + 104 },
            ]}
            ListEmptyComponent={
              <View style={styles.empty}>
                <View style={styles.illustration}>
                  <Icon name={isEmpty ? 'ledger' : 'search'} size={48} />
                </View>
                <AppText variant="section" style={styles.emptyTitle}>
                  {t(isEmpty ? 'ledger.noExpenses' : 'ledger.noResults')}
                </AppText>
                <AppText muted variant="small" style={styles.emptyDescription}>
                  {t(isEmpty ? 'ledger.addFirst' : 'ledger.changeFilters')}
                </AppText>
                <AppButton
                  onPress={isEmpty ? addExpense : clear}
                  variant={isEmpty ? 'primary' : 'secondary'}
                  style={styles.emptyAction}
                >
                  {t(isEmpty ? 'ledger.addExpense' : 'ledger.clearFilters')}
                </AppButton>
              </View>
            }
            ListFooterComponent={
              searchOpen && visible.length > 0 ? (
                <AppButton
                  variant="ghost"
                  style={styles.clearSearch}
                  onPress={() => setSearch('')}
                >
                  {t('ledger.clearSearch')}
                </AppButton>
              ) : undefined
            }
          />
        )}
      </Screen>
      {!isEmpty && !searchOpen && !ledger.error && (
        <View
          style={[
            styles.addPosition,
            {
              bottom:
                insets.bottom +
                navigationLayout.height +
                navigationLayout.bottomGap +
                12,
            },
          ]}
        >
          <AppButton icon="plus" onPress={addExpense}>
            {t('ledger.addExpense')}
          </AppButton>
        </View>
      )}
      <WorkspaceSheet
        visible={sheet === 'workspace'}
        workspace="ledger"
        isOwner
        onClose={() => setSheet(null)}
        onSelect={value => {
          setSheet(null);
          if (value === 'menu') onMenu();
        }}
      />
      {sheet === 'filters' && (
        <ExpenseFiltersSheet
          filters={filters}
          onClose={() => setSheet(null)}
          onApply={value => {
            setFilters(value);
            setSheet(null);
          }}
        />
      )}
      {sheet === 'date' && (
        <ExpenseDateSheet
          title={t('ledger.selectDate')}
          value={filters.period === 'custom' ? filters.from : dateKey()}
          onClose={() => setSheet(null)}
          onSelect={date => {
            setFilters(current => ({
              ...current,
              period: 'custom',
              from: date,
              to: date,
            }));
            setSheet(null);
          }}
        />
      )}
      <LedgerNotice
        hasTabs
        message={ledger.notice}
        onDismiss={ledger.dismissNotice}
      />
    </>
  );
}
const styles = StyleSheet.create({
  list: { flexGrow: 1 },
  periods: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginVertical: 14,
  },
  period: {
    flex: 1,
    minHeight: 44,
    paddingVertical: 12,
    paddingHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
  },
  active: { backgroundColor: colors.forest },
  activeText: { color: colors.white },
  tabText: {
    fontSize: 12,
    lineHeight: 16.8,
    textAlign: 'center',
    color: colors.muted,
  },
  searchRow: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  search: {
    flex: 1,
    minHeight: 49,
    borderRadius: 26,
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
  },
  searchLabel: { flex: 1, fontSize: 13, lineHeight: 18.2 },
  categories: { flexDirection: 'row', gap: 6, marginTop: 12, marginBottom: 14 },
  category: {
    flexGrow: 1,
    flexShrink: 1,
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingVertical: 12,
    borderRadius: 22,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
    minHeight: 370,
  },
  illustration: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.sage,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: { marginTop: 30, textAlign: 'center' },
  emptyDescription: { marginTop: 10, textAlign: 'center' },
  emptyAction: { width: '100%', maxWidth: 300, marginTop: 56 },
  addPosition: {
    position: 'absolute',
    alignSelf: 'center',
    width: '80%',
    maxWidth: 346,
  },
  clear: {
    minHeight: 44,
    width: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  matchCount: { marginBottom: 16 },
  clearSearch: { marginTop: 42 },
});
