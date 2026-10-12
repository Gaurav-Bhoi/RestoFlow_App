import React, { createContext, useContext, useCallback } from 'react';
import type { Session } from '../restaurant/types';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { signedIn, signedOut } from '../../store/slices/sessionSlice';

interface SessionContextValue {
  session: Session | null;
  signIn: (session: Session) => void;
  signOut: () => void;
}
const SessionContext = createContext<SessionContextValue | null>(null);
export function SessionProvider({ children }: React.PropsWithChildren) {
  const session = useAppSelector(state => state.session.current);
  const dispatch = useAppDispatch();
  const signIn = useCallback(
    (value: Session) => dispatch(signedIn(value)),
    [dispatch],
  );
  const signOut = useCallback(() => dispatch(signedOut()), [dispatch]);
  return (
    <SessionContext.Provider value={{ session, signIn, signOut }}>
      {children}
    </SessionContext.Provider>
  );
}
export function useSession() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession requires SessionProvider');
  }
  return context;
}
