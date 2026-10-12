import Config from 'react-native-config';
import { validateEnvironment } from './validateEnv';

// Native flavor/configuration chooses these values, including in OTA bundles.
export const ENV = validateEnvironment(Config);
