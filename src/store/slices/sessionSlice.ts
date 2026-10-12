import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Session } from '../../features/restaurant/types';

export interface SessionState {
  current: Session | null;
}
const initialState: SessionState = { current: null };
export const sessionSlice = createSlice({
  name: 'session',
  initialState,
  reducers: {
    signedIn(state, action: PayloadAction<Session>) {
      state.current = action.payload;
    },
    signedOut(state) {
      state.current = null;
    },
  },
});
export const { signedIn, signedOut } = sessionSlice.actions;
