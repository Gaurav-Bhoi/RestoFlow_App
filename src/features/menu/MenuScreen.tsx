import React, { useCallback, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { normalizeApiError } from '../../api/errors';
import { EmptyState } from '../../components/EmptyState';
import { colors } from '../../theme/tokens';
import { useTranslation } from 'react-i18next';
import { Screen } from '../../components/Screen';
import { SearchInput } from '../../components/SearchInput';
import { AppText } from '../../components/AppText';
import { AppButton } from '../../components/AppButton';
import { useResponsiveLayout } from '../../hooks/useResponsiveLayout';
import { useAppNavigation } from '../../app/navigationTypes';
import { useSession } from '../auth/SessionProvider';
import { useMenu } from './MenuProvider';
import { filterVisibleMenu, type MenuFilter } from './menuConfig';
import { DishCard } from './DishCard';
import { WorkspaceHeader } from './WorkspaceHeader';
import { WorkspaceSheet } from './WorkspaceSheet';
import { MenuFilters } from './MenuFilters';
import { MenuEmptyState } from './MenuEmptyState';
import {
  DishManagementOverlay,
  type DishSelection,
} from './DishManagementOverlay';
import { MenuNotice } from './MenuNotice';

export function MenuScreen() {
  const { t } = useTranslation();
  const navigation = useAppNavigation();
  const { session } = useSession();
  const isOwner = session?.role === 'owner';
  const {
    dishes,
    deleteDish,
    toggleAvailability,
    refreshing,
    refreshMenu,
    cancelRefresh,
    loadError,
    busy,
  } = useMenu();
  useFocusEffect(
    useCallback(() => {
      refreshMenu();
      return cancelRefresh;
    }, [refreshMenu, cancelRefresh]),
  );
  const [operationError, setOperationError] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<MenuFilter>('All');
  const [workspace, setWorkspace] = useState<'menu' | 'ledger'>('menu');
  const [workspaceOpen, setWorkspaceOpen] = useState(false);
  const [selection, setSelection] = useState<DishSelection | null>(null);
  const { contentWidth, fontScale } = useResponsiveLayout();
  const singleColumn =
    contentWidth < 270 || (fontScale >= 1.3 && contentWidth < 450);
  const cardWidth = {
    width: singleColumn ? contentWidth : (contentWidth - 16) / 2,
  };
  const visibleDishes = filterVisibleMenu(dishes, search, category);
  const isEmpty = dishes.length === 0;
  async function handleDishAction(action: 'delete' | 'availability') {
    if (!selection || busy) return;
    setOperationError('');
    try {
      if (action === 'delete') await deleteDish(selection.dish.id);
      else await toggleAvailability(selection.dish);
      setSelection(null);
    } catch (cause) {
      setOperationError(normalizeApiError(cause).message);
    }
  }
  const addDish = () => navigation.navigate('DishForm', {});
  const resetFilters = () => {
    setSearch('');
    setCategory('All');
  };
  return (
    <>
      <Screen
        hasTabs
        refreshing={refreshing}
        onRefresh={() => {
          refreshMenu();
        }}
        header={
          <WorkspaceHeader
            workspace={workspace}
            addDisabled={busy}
            onSwitch={() => setWorkspaceOpen(true)}
            onAdd={
              isOwner && !isEmpty && workspace === 'menu' ? addDish : undefined
            }
          />
        }
        contentStyle={(isEmpty || workspace === 'ledger') && styles.fill}
      >
        {workspace === 'ledger' ? (
          <MenuEmptyState ledger />
        ) : isEmpty && loadError ? (
          <EmptyState
            title={t('menu.loadMenuFailed')}
            description={loadError}
            action={{
              label: t('api.retry'),
              onPress: () => {
                refreshMenu();
              },
            }}
          />
        ) : isEmpty && refreshing ? (
          <ActivityIndicator
            accessibilityLabel={t('menu.loadingMenu')}
            color={colors.forest}
            style={styles.loading}
          />
        ) : isEmpty ? (
          <MenuEmptyState onAdd={isOwner ? addDish : undefined} />
        ) : (
          <>
            {!!loadError && (
              <View style={styles.loadError}>
                <AppText accessibilityRole="alert" style={styles.errorText}>
                  {loadError}
                </AppText>
                <AppButton
                  variant="ghost"
                  onPress={() => {
                    refreshMenu();
                  }}
                >
                  {t('api.retry')}
                </AppButton>
              </View>
            )}
            <SearchInput
              value={search}
              onChangeText={setSearch}
              placeholder={t('menu.searchTheMenu')}
            />
            <MenuFilters selected={category} onSelect={setCategory} />
            <View style={styles.grid}>
              {visibleDishes.map(dish => (
                <View key={dish.id} style={cardWidth}>
                  <DishCard
                    dish={dish}
                    disabled={busy}
                    onMore={
                      isOwner
                        ? () => {
                            setOperationError('');
                            setSelection({ dish, confirmingDelete: false });
                          }
                        : undefined
                    }
                  />
                </View>
              ))}
            </View>
            {visibleDishes.length === 0 && (
              <View style={styles.noResults}>
                <AppText muted style={styles.noResultsText}>
                  {t('menu.noDishesFoundTryAnotherNameOrCategory')}
                </AppText>
                <AppButton variant="secondary" onPress={resetFilters}>
                  {t('menu.clearFilters')}
                </AppButton>
              </View>
            )}
          </>
        )}
      </Screen>
      <MenuNotice />
      <WorkspaceSheet
        visible={workspaceOpen}
        workspace={workspace}
        isOwner={isOwner}
        onClose={() => setWorkspaceOpen(false)}
        onSelect={value => {
          setWorkspace(value);
          setWorkspaceOpen(false);
        }}
      />
      <DishManagementOverlay
        selection={selection}
        busy={busy}
        error={operationError}
        onClose={() => {
          if (!busy) {
            setSelection(null);
            setOperationError('');
          }
        }}
        onEdit={() => {
          if (selection)
            navigation.navigate('DishForm', { dishId: selection.dish.id });
          setSelection(null);
        }}
        onToggleAvailability={() => handleDishAction('availability')}
        onRequestDelete={() =>
          setSelection(current =>
            current ? { ...current, confirmingDelete: true } : null,
          )
        }
        onDelete={() => handleDishAction('delete')}
      />
    </>
  );
}
const styles = StyleSheet.create({
  loading: { flex: 1, minHeight: 200 },
  loadError: {
    backgroundColor: colors.dangerSoft,
    borderRadius: 17,
    padding: 12,
    marginBottom: 12,
  },
  errorText: { color: colors.error, fontSize: 12, lineHeight: 18 },
  fill: { flex: 1 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    rowGap: 19,
    marginTop: 11,
  },
  noResults: { alignItems: 'center', gap: 20, paddingVertical: 48 },
  noResultsText: { textAlign: 'center' },
});
