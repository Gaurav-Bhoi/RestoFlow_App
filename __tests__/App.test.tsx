/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import App from '../App';
import { AppInput } from '../src/components/AppInput';
import { AppButton } from '../src/components/AppButton';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DashboardScreen } from '../src/features/tables/DashboardScreen';
import { FloatingTabBar } from '../src/app/FloatingTabBar';
import { SettingsRow } from '../src/features/settings/SettingsRow';
import { RegistrationScreen } from '../src/features/auth/RegistrationScreen';
import { EmptyState } from '../src/components/EmptyState';
import { TableTile } from '../src/features/tables/TableTile';

beforeEach(async () => {
  await AsyncStorage.clear();
});

test('renders the native welcome screen after loading local restaurant data', async () => {
  let renderer: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(() => {
    renderer = ReactTestRenderer.create(<App />);
  });
  expect(renderer!.root.findByType(AppInput).props.label).toBe(
    'Your mobile number',
  );
  expect(renderer!.root.findByType(AppButton).props.children).toBe('Continue');
  expect(AsyncStorage.getItem).toHaveBeenCalled();
  await ReactTestRenderer.act(() => renderer!.unmount());
});

test.each([
  ['9876543210', true],
  ['9876543211', false],
])('signs in %s and applies role-specific settings', async (phone, isOwner) => {
  let renderer: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(() => {
    renderer = ReactTestRenderer.create(<App />);
  });
  await ReactTestRenderer.act(() => {
    renderer!.root.findByType(AppInput).props.onChangeText(phone);
  });
  await ReactTestRenderer.act(() => {
    renderer!.root.findByType(AppButton).props.onPress();
  });
  expect(renderer!.root.findAllByType(DashboardScreen)).toHaveLength(1);
  await ReactTestRenderer.act(() => {
    renderer!.root
      .findByType(FloatingTabBar)
      .props.navigation.navigate('Settings');
  });
  const settings = renderer!.root
    .findAllByType(SettingsRow)
    .map(row => row.props.title);
  expect(settings.includes('Waiter team')).toBe(isOwner);
  expect(settings.includes('Subscription')).toBe(isOwner);
  await ReactTestRenderer.act(() => renderer!.unmount());
});

test('validates registration, opens the empty floor, and adds the first table', async () => {
  let renderer: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(() => {
    renderer = ReactTestRenderer.create(<App />);
  });
  await ReactTestRenderer.act(() => {
    renderer!.root.findByType(AppInput).props.onChangeText('9876543212');
  });
  await ReactTestRenderer.act(() => {
    renderer!.root.findByType(AppButton).props.onPress();
  });
  const registration = () => renderer!.root.findByType(RegistrationScreen);
  const createAccount = () =>
    registration()
      .findAllByType(AppButton)
      .find(button => button.props.children === 'Create account')!;
  await ReactTestRenderer.act(() => createAccount().props.onPress());
  expect(
    registration().findAllByProps({ accessibilityRole: 'alert' }).length,
  ).toBeGreaterThan(0);
  expect(renderer!.root.findAllByType(DashboardScreen)).toHaveLength(0);
  await ReactTestRenderer.act(() => {
    const inputs = registration().findAllByType(AppInput);
    inputs[0].props.onChangeText('Saffron Kitchen');
    inputs[1].props.onChangeText('Gaurav');
  });
  await ReactTestRenderer.act(() => createAccount().props.onPress());
  const dashboard = () => renderer!.root.findByType(DashboardScreen);
  expect(dashboard().findByType(EmptyState).props.title).toBe(
    'Your floor starts here',
  );
  expect(dashboard().findAllByType(TableTile)).toHaveLength(0);
  await ReactTestRenderer.act(() => {
    dashboard().findByType(EmptyState).props.action.onPress();
  });
  expect(dashboard().findAllByType(EmptyState)).toHaveLength(0);
  expect(dashboard().findByType(TableTile).props.table.id).toBe(1);
  await ReactTestRenderer.act(() => renderer!.unmount());
});
