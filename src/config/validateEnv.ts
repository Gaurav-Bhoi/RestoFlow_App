export type AppEnvironment = 'development' | 'production';

export interface EnvironmentValues {
  APP_ENV?: string;
  API_BASE_URL?: string;
  ENABLE_API_LOGS?: string;
  MOCK_API?: string;
}

export function validateEnvironment(config: EnvironmentValues) {
  const { APP_ENV, API_BASE_URL, ENABLE_API_LOGS, MOCK_API } = config;
  if (APP_ENV !== 'development' && APP_ENV !== 'production') {
    throw new Error('APP_ENV must be development or production');
  }
  if (!API_BASE_URL) throw new Error('API_BASE_URL is missing');
  if (!['true', 'false'].includes(ENABLE_API_LOGS ?? '')) {
    throw new Error('ENABLE_API_LOGS must be true or false');
  }
  if (!['true', 'false'].includes(MOCK_API ?? '')) {
    throw new Error('MOCK_API must be true or false');
  }
  if (APP_ENV === 'production' && ENABLE_API_LOGS !== 'false') {
    throw new Error('Production API logging must be disabled');
  }
  const mock = MOCK_API === 'true';
  // A literal placeholder is allowed only in the explicitly requested mock setup.
  if (!(mock && API_BASE_URL === '<PRODUCTION_BACKEND_URL>')) {
    const url = new URL(API_BASE_URL);
    const local =
      APP_ENV === 'development' &&
      ['localhost', '127.0.0.1', '10.0.2.2', '[::1]'].includes(url.hostname);
    if (
      (url.protocol !== 'https:' && !(local && url.protocol === 'http:')) ||
      url.username ||
      url.password ||
      url.search ||
      url.hash ||
      url.pathname !== '/'
    ) {
      throw new Error('API_BASE_URL must be a valid API origin');
    }
  }
  return Object.freeze({
    APP_ENV,
    API_BASE_URL: API_BASE_URL.replace(/\/$/, ''),
    ENABLE_API_LOGS: ENABLE_API_LOGS === 'true',
    MOCK_API: mock,
    IS_DEVELOPMENT: APP_ENV === 'development',
    IS_PRODUCTION: APP_ENV === 'production',
  });
}
