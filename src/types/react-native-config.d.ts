declare module 'react-native-config' {
  export interface NativeConfig {
    APP_ENV?: 'development' | 'production';
    API_BASE_URL?: string;
    ENABLE_API_LOGS?: 'true' | 'false';
  }
  const Config: NativeConfig;
  export default Config;
}
