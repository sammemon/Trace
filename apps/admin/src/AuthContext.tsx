import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { authApi, tokenStore, type AuthUser } from './api';

interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (u: AuthUser) => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const at = tokenStore.getAccess();
    if (at) {
      import('./api').then(({ usersApi }) =>
        usersApi.me().then(setUser).catch(() => tokenStore.clear())
      ).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
    const handler = () => { tokenStore.clear(); setUser(null); };
    window.addEventListener('trace:unauthorized', handler);
    return () => window.removeEventListener('trace:unauthorized', handler);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const session = await authApi.login({ email, password });
    tokenStore.setAccess(session.accessToken);
    tokenStore.setRefresh(session.refreshToken);
    setUser(session.user);
  }, []);

  const logout = useCallback(async () => {
    try { await authApi.logout(); } catch { /* ignore */ }
    tokenStore.clear();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}