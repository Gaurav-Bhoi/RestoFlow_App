import React, { createContext, useContext, useState } from 'react';
import type { Session } from '../restaurant/types';

interface SessionContextValue {
  session: Session | null;
  signIn: (session: Session) => void;
  signOut: () => void;
}
const SessionContext = createContext<SessionContextValue | null>(null);
export function SessionProvider({ children }: React.PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  return (
    <SessionContext.Provider
      value={{ session, signIn: setSession, signOut: () => setSession(null) }}
    >
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
