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
