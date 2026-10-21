import { ENV } from './env';

// Temporary: development must not call the OTP request/verify endpoints.
export const USE_MOCK_OTP = ENV.IS_DEVELOPMENT;
