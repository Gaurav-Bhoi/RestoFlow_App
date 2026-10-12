import { createMMKV, type MMKV } from 'react-native-mmkv';
import { ENV } from '../../config/env';

let instance: MMKV | undefined;
export function getAppStorage(): MMKV {
  // Lazy creation lets bootstrap recover if native storage initialization fails.
  return (instance ??= createMMKV({ id: `restoflow.${ENV.APP_ENV}` }));
}
