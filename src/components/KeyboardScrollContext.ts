import { createContext } from 'react';
import type { TextInputInstance } from 'react-native';

export const KeyboardScrollContext = createContext<
  ((input: TextInputInstance) => void) | null
>(null);
