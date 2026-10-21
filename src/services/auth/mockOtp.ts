import type { OtpChallenge } from '../../api/types';

export const MOCK_OTP = '123456';
const challenges = new Map<
  string,
  {
    phoneNumber: string;
    registration: boolean;
    expiresAt: number;
  }
>();
let sequence = 0;

export const mockOtp = {
  async request(
    phoneNumber: string,
    registration: boolean,
  ): Promise<OtpChallenge> {
    if (!/^\+91[6-9]\d{9}$/.test(phoneNumber))
      throw new Error('Enter a valid 10-digit Indian mobile number.');
    for (const [id, value] of challenges)
      if (
        value.expiresAt <= Date.now() ||
        (value.phoneNumber === phoneNumber &&
          value.registration === registration)
      )
        challenges.delete(id);
    const challengeId = `mock-otp:${++sequence}`;
    challenges.set(challengeId, {
      phoneNumber,
      registration,
      expiresAt: Date.now() + 300000,
    });
    return { challengeId, expiresIn: 300, resendAfter: 0, mockCode: MOCK_OTP };
  },
  verify(challengeId: string, otp: string, registration: boolean) {
    const challenge = challenges.get(challengeId);
    if (!challenge || challenge.registration !== registration)
      throw {
        code: 'OTP_NOT_FOUND',
        message: 'Request a new mock verification code.',
      };
    if (challenge.expiresAt <= Date.now())
      throw {
        code: 'OTP_EXPIRED',
        message: 'The code has expired. Request a new code.',
      };
    if (otp !== MOCK_OTP)
      throw {
        code: 'INVALID_OTP',
        message: 'Use 123456 for mock verification.',
      };
    return challenge.phoneNumber;
  },
  consume(challengeId: string) {
    challenges.delete(challengeId);
  },
};
