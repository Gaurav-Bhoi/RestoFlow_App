import { apiClient } from '../src/api/client';
import { authApi } from '../src/api/restoflow';
import { account } from './support/apiFixtures';

const originalAdapter = apiClient.defaults.adapter;
const adapter = jest.fn(async config => ({
  config,
  status: 200,
  statusText: 'OK',
  headers: { 'x-restoflow-environment': 'development' },
  data: { success: true, data: account },
}));
beforeEach(() => {
  adapter.mockClear();
  apiClient.defaults.adapter = adapter;
});
afterEach(() => {
  apiClient.defaults.adapter = originalAdapter;
  jest.restoreAllMocks();
});

test('sending, resending, and verifying registration OTP never call HTTP', async () => {
  const old = await authApi.requestOtp('+917028189930', true);
  const challenge = await authApi.requestOtp('+917028189930', true);
  await expect(
    authApi.verifyRegistration(old.challengeId, '123456'),
  ).rejects.toMatchObject({ code: 'OTP_NOT_FOUND' });
  await expect(
    authApi.verifyRegistration(challenge.challengeId, '111111'),
  ).rejects.toMatchObject({ code: 'INVALID_OTP' });
  expect(challenge.mockCode).toBe('123456');
  const verified = await authApi.verifyRegistration(
    challenge.challengeId,
    '123456',
  );
  expect(verified.onboardingToken).toBe('dev-mock-onboarding:+917028189930');
  await expect(
    authApi.verifyRegistration(challenge.challengeId, '123456'),
  ).rejects.toMatchObject({ code: 'OTP_NOT_FOUND' });
  expect(adapter).not.toHaveBeenCalled();
});

test('restaurant saving after local OTP verification calls the real completion API', async () => {
  const challenge = await authApi.requestOtp('+917028189930', true);
  const verified = await authApi.verifyRegistration(
    challenge.challengeId,
    '123456',
  );
  expect(adapter).not.toHaveBeenCalled();
  await authApi.register(verified.onboardingToken, 'Owner', 'Real Restaurant');
  expect(adapter).toHaveBeenCalledTimes(1);
  const request = adapter.mock.calls[0][0];
  expect(request.url).toBe('/api/v1/onboarding/owner/complete');
  expect(request.data.get('restaurantName')).toBe('Real Restaurant');
  expect(request.headers.get('Authorization')).toBe(
    'Bearer dev-mock-onboarding:+917028189930',
  );
});

test('login verifies its mock code locally before calling the real login API', async () => {
  const challenge = await authApi.requestOtp('+917028189930');
  expect(adapter).not.toHaveBeenCalled();
  await expect(
    authApi.verifyLogin(challenge.challengeId, '000000'),
  ).rejects.toMatchObject({ code: 'INVALID_OTP' });
  expect(adapter).not.toHaveBeenCalled();
  expect(await authApi.verifyLogin(challenge.challengeId, '123456')).toEqual(
    account,
  );
  expect(adapter).toHaveBeenCalledTimes(1);
  expect(adapter.mock.calls[0][0].url).toBe('/api/v1/auth/login');
  expect(JSON.parse(adapter.mock.calls[0][0].data)).toEqual({
    phoneNumber: '+917028189930',
  });
  expect(adapter.mock.calls[0][0].headers.has('Authorization')).toBe(false);
});

test('expired and purpose-mismatched mock challenges do not send HTTP', async () => {
  const challenge = await authApi.requestOtp('+917028189930', true);
  await expect(
    authApi.verifyRegistration(
      (
        await authApi.requestOtp('+917028189931')
      ).challengeId,
      '123456',
    ),
  ).rejects.toMatchObject({ code: 'OTP_NOT_FOUND' });
  jest.spyOn(Date, 'now').mockReturnValue(Date.now() + 300001);
  await expect(
    authApi.verifyRegistration(challenge.challengeId, '123456'),
  ).rejects.toMatchObject({ code: 'OTP_EXPIRED' });
  expect(adapter).not.toHaveBeenCalled();
});
