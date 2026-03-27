'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

interface User {
  id: string;
  phone: string;
  fullName?: string;
  plan: string;
  credits: number;
}

interface AuthContextValue {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  signUp:  (phone: string, password: string, fullName?: string) => Promise<void>;
  signIn:  (phone: string, password: string) => Promise<void>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue>({} as AuthContextValue);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user,      setUser]      = useState<User | null>(null);
  const [token,     setToken]     = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Restore session from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('bf_token');
    const storedUser = localStorage.getItem('bf_user');
    if (stored && storedUser) {
      try {
        setToken(stored);
        setUser(JSON.parse(storedUser));
      } catch { /* corrupted */ }
    }
    setIsLoading(false);
  }, []);

  const persist = (t: string, u: User) => {
    localStorage.setItem('bf_token', t);
    localStorage.setItem('bf_user', JSON.stringify(u));
    // Also set cookie so Next.js middleware can read it for SSR protection
    document.cookie = `bf_token=${t}; path=/; max-age=${7 * 24 * 3600}; samesite=strict`;
    setToken(t);
    setUser(u);
  };

  const signUp = useCallback(async (phone: string, password: string, fullName?: string) => {
    const res = await fetch(`${API}/auth/signup`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ phone, password, fullName }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Sign up failed');
    persist(data.data.token, data.data.user);
    router.push('/dashboard');
  }, [router]);

  const signIn = useCallback(async (phone: string, password: string) => {
    const res = await fetch(`${API}/auth/login`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ phone, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Sign in failed');
    persist(data.data.token, data.data.user);
    router.push('/dashboard');
  }, [router]);

  const signOut = useCallback(() => {
    localStorage.removeItem('bf_token');
    localStorage.removeItem('bf_user');
    document.cookie = 'bf_token=; path=/; max-age=0';
    setToken(null);
    setUser(null);
    router.push('/login');
  }, [router]);

  return (
    <AuthContext.Provider value={{ user, token, isLoading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
