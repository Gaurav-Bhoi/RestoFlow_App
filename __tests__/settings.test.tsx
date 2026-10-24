import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';
import { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { launchImageLibrary } from 'react-native-image-picker';
import App from '../App';
import { apiClient } from '../src/api/client';
import { AppButton } from '../src/components/AppButton';
import { AppInput } from '../src/components/AppInput';
import { AppText } from '../src/components/AppText';
import { Avatar } from '../src/components/Avatar';
import { PhotoPicker } from '../src/components/PhotoPicker';
import { FloatingTabBar } from '../src/app/FloatingTabBar';
import { EditProfileScreen } from '../src/features/settings/EditProfileScreen';
import { ChangePasswordScreen } from '../src/features/settings/ChangePasswordScreen';
import { SettingsScreen } from '../src/features/settings/SettingsScreen';
import { SettingsRow } from '../src/features/settings/SettingsRow';
import { LoginScreen } from '../src/features/auth/LoginScreen';
import { getCredentials, saveTokens } from '../src/services/auth/credentials';
import { store } from '../src/store';
import { sourceVersion } from '../src/localization/catalogMetadata';
import {
  account,
  DEV_ORIGIN,
  restaurantId,
  subscription,
} from './support/apiFixtures';

const originalAdapter = apiClient.defaults.adapter;
// Initialize native multipart support before Axios captures the constructor.
jest.mock('axios', () => {
  Object.defineProperty(globalThis, 'FormData', {
    value: jest.requireActual('react-native/Libraries/Network/FormData')
      .default,
    configurable: true,
    writable: true,
  });
  return jest.requireActual('axios');
});
let renderer: ReactTestRenderer.ReactTestRenderer | undefined;
let adapter: jest.Mock;
let user: typeof account.user;
let role: 'OWNER' | 'WAITER';
let failProfile: boolean;
let failPassword: boolean;
let expireAccessToken: boolean;
let confirmPasswordChange: boolean;
beforeEach(async () => {
  role = 'OWNER';
  user = { ...account.user };
  failProfile = false;
  failPassword = false;
  expireAccessToken = false;
  confirmPasswordChange = true;
  jest.mocked(launchImageLibrary).mockReset();
  jest.mocked(launchImageLibrary).mockResolvedValue({ didCancel: true });
  await saveTokens(account);
  adapter = jest.fn(async (config: InternalAxiosRequestConfig) => {
    const path = config.url!;
    let data: unknown;
    const failure = (status: number, code: string, message: string) => {
      throw new AxiosError(message, 'ERR_BAD_REQUEST', config, undefined, {
        config,
        status,
        statusText: '',
        headers: { 'x-restoflow-environment': 'development' },
        data: { success: false, error: { code, message } },
      });
    };
    if (path === '/api/v1/i18n/languages')
      data = { sourceLanguage: 'en', sourceVersion, languages: [] };
    else if (path === '/api/v1/auth/me' && config.method === 'patch') {
      if (failProfile) failure(500, 'DATABASE_ERROR', 'Save failed');
      const parts = config.data.getParts();
      user = {
        ...user,
        fullName: parts.find(
          (part: { fieldName: string }) => part.fieldName === 'fullName',
        ).string,
        profileImageUrl: parts.some(
          (part: { fieldName: string }) => part.fieldName === 'image',
        )
          ? `/api/v1/media/users/${user.id}/profile/saved.png`
          : user.profileImageUrl,
      };
      data = user;
    } else if (path === '/api/v1/auth/me')
      data = { user, restaurants: [{ ...account.restaurants[0], role }] };
    else if (path === '/api/v1/auth/password') {
      if (
        expireAccessToken &&
        config.headers.get('Authorization') === 'Bearer access-token'
      )
        failure(401, 'INVALID_ACCESS_TOKEN', 'Access token has expired.');
      if (failPassword)
        failure(401, 'INVALID_CREDENTIALS', 'Current password is incorrect.');
      data = { passwordChanged: confirmPasswordChange };
    } else if (path === '/api/v1/auth/refresh') {
      data = {
        accessToken: 'refreshed-access-token',
        refreshToken: 'refreshed-refresh-token',
        accessTokenExpiresIn: 900,
        refreshTokenExpiresIn: 2592000,
      };
    } else if (path.endsWith('/subscription')) data = subscription;
    else if (path.endsWith('/dashboard'))
      data = {
        totalTables: 0,
        occupiedTables: 0,
        guestCount: 0,
        availableTables: 0,
        openOrderTotal: '0.00',
        currency: 'INR',
      };
    else if (path.endsWith(restaurantId))
      data = { name: 'Restaurant', owner: user };
    else if (
      ['/tables', '/menu/dishes', '/orders', '/waiters'].some(suffix =>
        path.endsWith(suffix),
      )
    )
      data = [];
    else throw new Error(`Unexpected settings request: ${path}`);
    return {
      config,
      status: 200,
      statusText: 'OK',
      headers: { 'x-restoflow-environment': 'development' },
      data: { success: true, data },
    };
  });
  apiClient.defaults.adapter = adapter;
});
afterEach(async () => {
  if (renderer) await act(async () => renderer!.unmount());
  renderer = undefined;
  apiClient.defaults.adapter = originalAdapter;
});
async function openSettings() {
  await act(async () => {
    renderer = ReactTestRenderer.create(<App />);
  });
  await act(async () =>
    renderer!.root
      .findByType(FloatingTabBar)
      .props.navigation.navigate('Settings'),
  );
}
async function openRow(title: string) {
  await act(async () =>
    renderer!.root
      .findAllByType(SettingsRow)
      .find(row => row.props.title === title)!
      .props.onPress(),
  );
}
async function fill(fields: Record<string, string>) {
  await act(async () => {
    for (const [label, value] of Object.entries(fields))
      renderer!.root
        .findAllByType(AppInput)
        .find(input => input.props.label === label)!
        .props.onChangeText(value);
  });
}
async function press(label: string) {
  await act(async () =>
    renderer!.root
      .findAllByType(AppButton)
      .find(button => button.props.children === label)!
      .props.onPress(),
  );
}
const requests = (path: string) =>
  adapter.mock.calls
    .map(([request]) => request as InternalAxiosRequestConfig)
    .filter(request => request.url === path);
const passwordFields = {
  'Old password': ' old password ',
  'New password': ' new password ',
  'Confirm password': ' new password ',
};
function hasMessage(message: string) {
  return renderer!.root
    .findAllByType(AppText)
    .some(text => text.props.children === message);
}

test.each(['OWNER', 'WAITER'] as const)(
  '%s can navigate to profile and password settings',
  async value => {
    role = value;
    await openSettings();
    await openRow('Edit profile');
    expect(renderer!.root.findAllByType(EditProfileScreen)).toHaveLength(1);
    expect(renderer!.root.findByType(AppInput).props.value).toBe(
      account.user.fullName,
    );
    await act(async () =>
      renderer!.root.findByType(EditProfileScreen).props.navigation.goBack(),
    );
    await openRow('Change password');
    expect(renderer!.root.findAllByType(ChangePasswordScreen)).toHaveLength(1);
    expect(
      renderer!.root.findAllByType(AppInput).map(input => input.props.label),
    ).toEqual(['Old password', 'New password', 'Confirm password']);
    expect(
      renderer!.root
        .findAllByType(AppInput)
        .every(input => input.props.secureTextEntry),
    ).toBe(true);
  },
);

test('profile save persists the trimmed name, preserves the existing photo, and returns to settings', async () => {
  user.profileImageUrl = `/api/v1/media/users/${user.id}/profile/existing.png`;
  await openSettings();
  await openRow('Edit profile');
  await fill({ 'Your name': '  Updated Name  ' });
  await press('Save profile');
  expect(user.fullName).toBe('Updated Name');
  expect(store.getState().session.current).toMatchObject({
    name: 'Updated Name',
    photo: `${DEV_ORIGIN}${user.profileImageUrl}`,
  });
  expect(renderer!.root.findAllByType(EditProfileScreen)).toHaveLength(0);
  expect(renderer!.root.findAllByType(SettingsScreen)).toHaveLength(1);
  expect(
    requests('/api/v1/auth/me').filter(request => request.method === 'patch'),
  ).toHaveLength(1);
  expect(await getCredentials()).not.toBeNull();
});

test('selected profile photos use native multipart files and the confirmed server media URL', async () => {
  jest.mocked(launchImageLibrary).mockResolvedValue({
    assets: [{ uri: 'file:///profile.png', type: 'image/png', fileSize: 1024 }],
  });
  await openSettings();
  await openRow('Edit profile');
  await act(async () => renderer!.root.findByType(PhotoPicker).props.onPress());
  expect(renderer!.root.findByType(PhotoPicker).props.photo).toBe(
    'file:///profile.png',
  );
  await press('Save profile');
  const request = requests('/api/v1/auth/me').find(
    value => value.method === 'patch',
  )!;
  expect(request.headers.get('Authorization')).toBe('Bearer access-token');
  expect(request.headers.get('Content-Type')).toBe('multipart/form-data');
  expect(
    request.data
      .getParts()
      .find((part: { fieldName: string }) => part.fieldName === 'image'),
  ).toMatchObject({
    uri: 'file:///profile.png',
    name: 'profile.png',
    headers: { 'content-type': 'image/png' },
  });
  expect(
    renderer!.root.findByType(SettingsScreen).findByType(Avatar).props.photo,
  ).toBe(`${DEV_ORIGIN}${user.profileImageUrl}`);
});

test('invalid names and failed profile saves leave account details unchanged and allow retry', async () => {
  await openSettings();
  await openRow('Edit profile');
  await fill({ 'Your name': ' ' });
  await press('Save profile');
  expect(hasMessage('Enter a name between 2 and 100 characters.')).toBe(true);
  expect(
    requests('/api/v1/auth/me').filter(request => request.method === 'patch'),
  ).toHaveLength(0);
  await fill({ 'Your name': 'Saved Name' });
  failProfile = true;
  await press('Save profile');
  expect(store.getState().session.current?.name).toBe(account.user.fullName);
  expect(renderer!.root.findByType(AppInput).props.value).toBe('Saved Name');
  expect(hasMessage('The server is unavailable. Please try again later.')).toBe(
    true,
  );
  failProfile = false;
  await press('Save profile');
  expect(store.getState().session.current?.name).toBe('Saved Name');
});

test('empty, short, overlong, and mismatched passwords are rejected before an API request', async () => {
  await openSettings();
  await openRow('Change password');
  await press('Update password');
  expect(hasMessage('Enter your old password.')).toBe(true);
  await fill({ ...passwordFields, 'New password': 'short' });
  await press('Update password');
  expect(hasMessage('Password must be between 8 and 128 characters.')).toBe(
    true,
  );
  await fill({
    'New password': 'x'.repeat(129),
    'Confirm password': 'x'.repeat(129),
  });
  await press('Update password');
  expect(hasMessage('Password must be between 8 and 128 characters.')).toBe(
    true,
  );
  await fill({
    'New password': 'password123',
    'Confirm password': 'different123',
  });
  await press('Update password');
  expect(hasMessage('Passwords do not match.')).toBe(true);
  expect(requests('/api/v1/auth/password')).toHaveLength(0);
});

test('a wrong old password preserves the session and entered fields, then a successful retry signs out', async () => {
  failPassword = true;
  await openSettings();
  await openRow('Change password');
  await fill(passwordFields);
  await press('Update password');
  expect(hasMessage('Old password is incorrect.')).toBe(true);
  expect(renderer!.root.findAllByType(ChangePasswordScreen)).toHaveLength(1);
  expect(await getCredentials()).not.toBeNull();
  expect(requests('/api/v1/auth/refresh')).toHaveLength(0);
  failPassword = false;
  await press('Update password');
  const request = requests('/api/v1/auth/password')[1];
  expect(JSON.parse(request.data)).toEqual({
    currentPassword: ' old password ',
    newPassword: ' new password ',
  });
  expect(request.headers.get('Authorization')).toBe('Bearer access-token');
  expect(await getCredentials()).toBeNull();
  expect(store.getState().session.current).toBeNull();
  expect(renderer!.root.findAllByType(LoginScreen)).toHaveLength(1);
  expect(requests('/api/v1/auth/logout')).toHaveLength(0);
});

test('an unconfirmed password change does not clear the session or show success', async () => {
  confirmPasswordChange = false;
  await openSettings();
  await openRow('Change password');
  await fill(passwordFields);
  await press('Update password');
  expect(hasMessage('The backend did not confirm the password change.')).toBe(
    true,
  );
  expect(await getCredentials()).not.toBeNull();
  expect(store.getState().session.current).not.toBeNull();
});

test('a wrong old password after token refresh remains a form error and keeps the refreshed session', async () => {
  expireAccessToken = true;
  failPassword = true;
  await openSettings();
  await openRow('Change password');
  await fill(passwordFields);
  await press('Update password');
  expect(hasMessage('Old password is incorrect.')).toBe(true);
  expect(requests('/api/v1/auth/refresh')).toHaveLength(1);
  expect(requests('/api/v1/auth/password')).toHaveLength(2);
  expect(await getCredentials()).toMatchObject({
    accessToken: 'refreshed-access-token',
    refreshToken: 'refreshed-refresh-token',
  });
  expect(store.getState().session.current).not.toBeNull();
  expect(renderer!.root.findAllByType(ChangePasswordScreen)).toHaveLength(1);
});
