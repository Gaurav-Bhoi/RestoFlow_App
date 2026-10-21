import environments from '../../config/environments.json';
export type AppEnvironment = 'development' | 'production';
export interface EnvironmentValues {
  APP_ENV?: string;
  API_BASE_URL?: string;
  ENABLE_API_LOGS?: string;
}
export function validateEnvironment(config: EnvironmentValues) {
  const { APP_ENV, API_BASE_URL, ENABLE_API_LOGS } = config;
  if (APP_ENV !== 'development' && APP_ENV !== 'production')
    throw new Error('APP_ENV must be development or production');
  if (!API_BASE_URL) throw new Error('API_BASE_URL is missing');
  if (!['true', 'false'].includes(ENABLE_API_LOGS ?? ''))
    throw new Error('ENABLE_API_LOGS must be true or false');
  if (APP_ENV === 'production' && ENABLE_API_LOGS !== 'false')
    throw new Error('Production API logging must be disabled');
  assertApiOrigin(API_BASE_URL, APP_ENV);
  const url = new URL(API_BASE_URL);
  return Object.freeze({
    APP_ENV,
    API_BASE_URL: url.origin,
    ENABLE_API_LOGS: ENABLE_API_LOGS === 'true',
    IS_DEVELOPMENT: APP_ENV === 'development',
    IS_PRODUCTION: APP_ENV === 'production',
  });
}

export function assertApiOrigin(origin: string, environment: AppEnvironment) {
  const url = new URL(origin);
  if (
    url.origin !== environments[environment].apiOrigin ||
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    url.pathname !== '/'
  ) {
    throw new Error(
      'API_BASE_URL must match the configured Worker origin for this environment.',
    );
  }
}
