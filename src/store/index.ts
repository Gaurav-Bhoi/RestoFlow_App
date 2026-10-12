import { configureStore } from '@reduxjs/toolkit';
import { sessionSlice } from './slices/sessionSlice';
import { ENV } from '../config/env';

export const createAppStore = () =>
  configureStore({
    reducer: { session: sessionSlice.reducer },
    devTools: __DEV__ && ENV.IS_DEVELOPMENT,
  });
export const store = createAppStore();
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
