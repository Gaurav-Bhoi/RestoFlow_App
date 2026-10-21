import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { TextInput } from 'react-native';
import { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { saveTokens } from '../src/services/auth/credentials';
import App from '../App';
import { apiClient } from '../src/api/client';
import { AppInput } from '../src/components/AppInput';
import { AppButton } from '../src/components/AppButton';
import { DashboardScreen } from '../src/features/tables/DashboardScreen';
import { RegistrationScreen } from '../src/features/auth/RegistrationScreen';
import { FloatingTabBar } from '../src/app/FloatingTabBar';
import { SettingsRow } from '../src/features/settings/SettingsRow';
import { TableTile } from '../src/features/tables/TableTile';
import { account, subscription, tableId } from './support/apiFixtures';
import { sourceVersion } from '../src/localization/catalogMetadata';
const originalAdapter = apiClient.defaults.adapter;
let role: 'OWNER' | 'WAITER';
let serverTables: {
  id: string;
  tableNumber: number;
  name: string;
  occupied: boolean;
  openOrderCount: number;
}[];
let adapter: jest.Mock;
let registrationFails: boolean;
let phoneCheckFails: boolean;
beforeEach(() => {
  role = 'OWNER';
  registrationFails = false;
  phoneCheckFails = false;
  serverTables = [];
  adapter = jest.fn(async (config: InternalAxiosRequestConfig) => {
    const path = config.url!;
    const login = {
      ...account,
      restaurants: [{ ...account.restaurants[0], role }],
    };
    let data: unknown;
    let status = 200;
    if (path === '/api/v1/i18n/languages')
      data = { sourceLanguage: 'en', sourceVersion, languages: [] };
    else if (path === '/api/v1/auth/phone/check') {
      if (phoneCheckFails)
        throw new AxiosError('network', 'ERR_NETWORK', config);
      data = {
        registered: JSON.parse(config.data).phoneNumber !== '+919876543212',
      };
    } else if (
      path === '/api/v1/auth/login' ||
      path.endsWith('/auth/me') ||
      path.endsWith('/onboarding/owner/complete')
    ) {
      if (path.endsWith('/onboarding/owner/complete') && registrationFails)
        throw new AxiosError(
          'save failed',
          'ERR_BAD_RESPONSE',
          config,
          undefined,
          {
            config,
            status: 500,
            statusText: 'Internal Server Error',
            headers: { 'x-restoflow-environment': 'development' },
            data: {
              success: false,
              error: { code: 'DATABASE_ERROR', message: 'Save failed.' },
            },
          },
        );
      data = login;
    } else if (path.endsWith('/subscription')) data = subscription;
    else if (path.endsWith('/dashboard'))
      data = {
        totalTables: serverTables.length,
        occupiedTables: 0,
        guestCount: 0,
        availableTables: serverTables.length,
        openOrderTotal: '0.00',
        currency: 'INR',
      };
    else if (path.endsWith('/tables') && config.method === 'post') {
      const table = {
        id: tableId,
        tableNumber: 1,
        name: 'Table 1',
        occupied: false,
        openOrderCount: 0,
      };
      serverTables.push(table);
      data = table;
      status = 201;
    } else if (path.endsWith('/tables')) data = serverTables;
    else if (
      path.endsWith('/menu/dishes') ||
      path.endsWith('/waiters') ||
      path.endsWith('/orders')
    )
      data = [];
    else if (path.endsWith(account.restaurants[0].id))
      data = { name: account.restaurants[0].name, owner: account.user };
    else throw new Error(`Unexpected test request ${path}`);
    return {
      status,
      statusText: 'OK',
      data: { success: true, data },
      headers: { 'x-restoflow-environment': 'development' },
      config,
    };
  });
  apiClient.defaults.adapter = adapter;
});
afterEach(() => {
  expect(
    adapter.mock.calls.some(
      ([config]) =>
        config.url?.includes('/otp/') ||
        config.url?.includes('/development/session'),
    ),
  ).toBe(false);
  apiClient.defaults.adapter = originalAdapter;
});
async function render() {
  let renderer: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    renderer = ReactTestRenderer.create(<App />);
  });
  return renderer!;
}
async function press(
  renderer: ReactTestRenderer.ReactTestRenderer,
  label: string,
) {
  await ReactTestRenderer.act(async () => {
    await renderer.root
      .findAllByType(AppButton)
      .find(button => button.props.children === label)!
      .props.onPress();
  });
}
test('welcome starts with an empty phone and does not seed restaurant data', async () => {
  const renderer = await render();
  expect(renderer.root.findByType(AppInput).props.value).toBe('');
  expect(renderer.root.findByType(AppInput).props.label).toBe(
    'Your mobile number',
  );
  expect(renderer.root.findByType(AppButton).props.children).toBe('Continue');
  expect(
    adapter.mock.calls.some(([config]) => config.url?.includes('/restaurants')),
  ).toBe(false);
  await ReactTestRenderer.act(async () => renderer.unmount());
});
test.each(['OWNER', 'WAITER'] as const)(
  'restored %s membership loads role-specific settings',
  async value => {
    role = value;
    await saveTokens(account);
    const renderer = await render();
    expect(renderer.root.findAllByType(DashboardScreen)).toHaveLength(1);
    await ReactTestRenderer.act(async () =>
      renderer.root
        .findByType(FloatingTabBar)
        .props.navigation.navigate('Settings'),
    );
    const titles = renderer.root
      .findAllByType(SettingsRow)
      .map(row => row.props.title);
    expect(titles.includes('Waiter team')).toBe(value === 'OWNER');
    await ReactTestRenderer.act(async () => renderer.unmount());
  },
);
test('phone, restaurant details, and local OTP lead to real registration and the dashboard', async () => {
  const renderer = await render();
  await ReactTestRenderer.act(async () =>
    renderer.root.findByType(AppInput).props.onChangeText('9876543212'),
  );
  await press(renderer, 'Continue');
  expect(
    adapter.mock.calls
      .filter(([config]) => !config.url.startsWith('/api/v1/i18n/'))
      .map(([config]) => config.url),
  ).toEqual(['/api/v1/auth/phone/check']);
  expect(renderer.root.findAllByType(RegistrationScreen)).toHaveLength(1);
  await press(renderer, 'Send verification code');
  expect(
    adapter.mock.calls.some(([config]) =>
      config.url.endsWith('/onboarding/owner/otp/request'),
    ),
  ).toBe(false);
  await ReactTestRenderer.act(async () => {
    const inputs = renderer.root.findAllByType(AppInput);
    inputs
      .find(input => input.props.label === 'Restaurant name')!
      .props.onChangeText('Test Restaurant');
    inputs
      .find(input => input.props.label === 'Your name')!
      .props.onChangeText('Test Owner');
  });
  await press(renderer, 'Send verification code');
  expect(JSON.stringify(renderer.toJSON())).toContain('No SMS is sent.');
  await ReactTestRenderer.act(async () =>
    renderer.root
      .findAllByType(TextInput)
      .find(
        input => input.props.accessibilityLabel === 'Verification code, 1/6',
      )!
      .props.onChangeText('000000'),
  );
  await press(renderer, 'Verify and create account');
  expect(
    adapter.mock.calls
      .filter(([config]) => !config.url.startsWith('/api/v1/i18n/'))
      .map(([config]) => config.url),
  ).toEqual(['/api/v1/auth/phone/check']);
  expect(
    adapter.mock.calls.some(([config]) =>
      config.url.endsWith('/onboarding/owner/complete'),
    ),
  ).toBe(false);
  await ReactTestRenderer.act(async () =>
    renderer.root
      .findAllByType(TextInput)
      .find(
        input => input.props.accessibilityLabel === 'Verification code, 1/6',
      )!
      .props.onChangeText('123456'),
  );
  await press(renderer, 'Verify and create account');
  const completion = adapter.mock.calls.find(([config]) =>
    config.url.endsWith('/onboarding/owner/complete'),
  )![0];
  expect(completion.headers.get('Authorization')).toBe(
    'Bearer dev-mock-onboarding:+919876543212',
  );
  expect(completion.data.get('fullName')).toBe('Test Owner');
  expect(completion.data.get('restaurantName')).toBe('Test Restaurant');
  expect(completion.headers.get('Content-Type')).toBe('multipart/form-data');
  expect(renderer.root.findAllByType(TableTile)).toHaveLength(0);
  await press(renderer, 'Add first table');
  expect(renderer.root.findByType(TableTile).props.table.id).toBe(tableId);
  expect(
    adapter.mock.calls.some(
      ([config]) => config.url.endsWith('/tables') && config.method === 'post',
    ),
  ).toBe(true);
  await ReactTestRenderer.act(async () => renderer.unmount());
});

test('failed restaurant registration stays on the form and can retry the real save', async () => {
  registrationFails = true;
  const renderer = await render();
  await ReactTestRenderer.act(async () =>
    renderer.root.findByType(AppInput).props.onChangeText('9876543212'),
  );
  await press(renderer, 'Continue');
  await ReactTestRenderer.act(async () => {
    const inputs = renderer.root.findAllByType(AppInput);
    inputs
      .find(input => input.props.label === 'Restaurant name')!
      .props.onChangeText('Real Restaurant');
    inputs
      .find(input => input.props.label === 'Your name')!
      .props.onChangeText('Real Owner');
  });
  await press(renderer, 'Send verification code');
  await ReactTestRenderer.act(async () =>
    renderer.root
      .findAllByType(TextInput)
      .find(
        input => input.props.accessibilityLabel === 'Verification code, 1/6',
      )!
      .props.onChangeText('123456'),
  );
  await press(renderer, 'Verify and create account');
  expect(renderer.root.findAllByType(DashboardScreen)).toHaveLength(0);
  expect(renderer.root.findAllByType(RegistrationScreen)).toHaveLength(1);
  expect(JSON.stringify(renderer.toJSON())).toContain(
    'The server is unavailable. Please try again later.',
  );
  registrationFails = false;
  await press(renderer, 'Verify and create account');
  expect(
    adapter.mock.calls.filter(([config]) =>
      config.url.endsWith('/onboarding/owner/complete'),
    ),
  ).toHaveLength(2);
  expect(renderer.root.findAllByType(DashboardScreen)).toHaveLength(1);
  await ReactTestRenderer.act(async () => renderer.unmount());
});

test.each(['OWNER', 'WAITER'] as const)(
  'registered %s phone uses local OTP and real login instead of registration',
  async value => {
    role = value;
    const renderer = await render();
    await ReactTestRenderer.act(async () =>
      renderer.root.findByType(AppInput).props.onChangeText('9876543210'),
    );
    await press(renderer, 'Continue');
    expect(renderer.root.findAllByType(RegistrationScreen)).toHaveLength(0);
    expect(renderer.root.findAllByType(DashboardScreen)).toHaveLength(0);
    expect(
      adapter.mock.calls
        .filter(([config]) => !config.url.startsWith('/api/v1/i18n/'))
        .map(([config]) => config.url),
    ).toEqual(['/api/v1/auth/phone/check']);
    const firstBox = () =>
      renderer.root
        .findAllByType(TextInput)
        .find(
          input => input.props.accessibilityLabel === 'Verification code, 1/6',
        )!;
    await ReactTestRenderer.act(async () =>
      firstBox().props.onChangeText('000000'),
    );
    await press(renderer, 'Verify and sign in');
    expect(
      adapter.mock.calls.some(
        ([config]) => config.url === '/api/v1/auth/login',
      ),
    ).toBe(false);
    await ReactTestRenderer.act(async () =>
      firstBox().props.onChangeText('123456'),
    );
    await press(renderer, 'Verify and sign in');
    expect(renderer.root.findAllByType(DashboardScreen)).toHaveLength(1);
    expect(
      adapter.mock.calls.filter(
        ([config]) => config.url === '/api/v1/auth/login',
      ),
    ).toHaveLength(1);
    expect(
      adapter.mock.calls.some(([config]) =>
        config.url.endsWith('/onboarding/owner/complete'),
      ),
    ).toBe(false);
    await ReactTestRenderer.act(async () =>
      renderer.root
        .findByType(FloatingTabBar)
        .props.navigation.navigate('Settings'),
    );
    expect(
      renderer.root
        .findAllByType(SettingsRow)
        .some(row => row.props.title === 'Waiter team'),
    ).toBe(value === 'OWNER');
    await ReactTestRenderer.act(async () => renderer.unmount());
  },
);

test('a phone lookup failure stays on the phone screen instead of treating the account as new', async () => {
  phoneCheckFails = true;
  const renderer = await render();
  await ReactTestRenderer.act(async () =>
    renderer.root.findByType(AppInput).props.onChangeText('9876543210'),
  );
  await press(renderer, 'Continue');
  expect(renderer.root.findAllByType(RegistrationScreen)).toHaveLength(0);
  expect(JSON.stringify(renderer.toJSON())).toContain(
    'Unable to connect. Please check your connection.',
  );
  expect(
    adapter.mock.calls
      .filter(([config]) => !config.url.startsWith('/api/v1/i18n/'))
      .map(([config]) => config.url),
  ).toEqual(['/api/v1/auth/phone/check']);
  await ReactTestRenderer.act(async () => renderer.unmount());
});
