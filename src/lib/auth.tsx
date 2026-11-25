import { useQueryClient } from '@tanstack/react-query';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { auth, call, loadToken, saveToken, setSignedOutHandler, type AccountUser } from './api';
import { unregisterPush } from './push';

type Status = 'loading' | 'signedOut' | 'signedIn';

type AuthValue = {
  status: Status;
  user: AccountUser | null;
  signIn: (email: string, password: string) => Promise<void>;
  /** After sign-up: confirm the emailed code, which signs the person in. */
  confirmSignUp: (email: string, code: string, firstName: string, lastName: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient();
  const [status, setStatus] = useState<Status>('loading');
  const [user, setUser] = useState<AccountUser | null>(null);

  const clear = useCallback(async () => {
    await saveToken(null);
    setUser(null);
    setStatus('signedOut');
    qc.clear();
  }, [qc]);

  useEffect(() => {
    // A rejected token anywhere (expired, password changed) signs the app out.
    setSignedOutHandler(() => {
      clear();
    });
    (async () => {
      const token = await loadToken();
      if (!token) return setStatus('signedOut');
      try {
        setUser(await auth.me());
        setStatus('signedIn');
      } catch {
        await clear();
      }
    })();
    return () => setSignedOutHandler(null);
  }, [clear]);

  const finish = useCallback(async (token: string, known?: AccountUser) => {
    await saveToken(token);
    setUser(known?.id ? known : await auth.me());
    setStatus('signedIn');
  }, []);

  const value = useMemo<AuthValue>(() => ({
    status,
    user,
    signIn: async (email, password) => {
      const res = await auth.login(email.trim().toLowerCase(), password);
      if (!res?.access_token) throw new Error('Sign-in failed. Check your email and password.');
      await finish(res.access_token, res.user);
    },
    confirmSignUp: async (email, code, firstName, lastName) => {
      const res = await auth.verifyOtp(email.trim().toLowerCase(), code.trim());
      if (!res?.access_token) throw new Error('That code did not work. Check it and try again.');
      await saveToken(res.access_token);
      // Fair Central keeps the account's first and last name itself.
      await call('exhibitorPortal', { action: 'saveAccount', account: { first_name: firstName.trim(), last_name: lastName.trim() } }).catch(() => null);
      await finish(res.access_token);
    },
    signOut: async () => {
      await unregisterPush().catch(() => null);
      await clear();
    },
    refreshUser: async () => {
      setUser(await auth.me());
    },
  }), [status, user, finish, clear]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
