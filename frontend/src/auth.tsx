import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api, setToken, clearToken, getToken } from './api';

export type User = {
  id: string; name: string; email: string; role: string;
  bio?: string; avatar?: string; location?: string;
  verified: boolean; verification_level: string;
  followers: number; posts_count: number; created_at: string;
};

type AuthCtx = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (body: any) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  updateProfile: (body: any) => Promise<void>;
};

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const bootstrap = useCallback(async () => {
    setLoading(true);
    const t = await getToken();
    if (t) {
      try {
        const me = await api.me();
        setUser(me);
      } catch {
        await clearToken();
        setUser(null);
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => { bootstrap(); }, [bootstrap]);

  const login = async (email: string, password: string) => {
    const res = await api.login({ email, password });
    await setToken(res.access_token);
    setUser(res.user);
  };
  const register = async (body: any) => {
    const res = await api.register(body);
    await setToken(res.access_token);
    setUser(res.user);
  };
  const logout = async () => {
    await clearToken();
    setUser(null);
  };
  const refresh = async () => {
    try { setUser(await api.me()); } catch {}
  };
  const updateProfile = async (body: any) => {
    const u = await api.updateMe(body);
    setUser(u);
  };

  return <Ctx.Provider value={{ user, loading, login, register, logout, refresh, updateProfile }}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAuth outside AuthProvider');
  return ctx;
}
