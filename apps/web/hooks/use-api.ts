'use client';
import { useCallback } from 'react';

// Relative path works via Next.js rewrites proxy in production (next.config.mjs).
// Falls back to absolute URL if NEXT_PUBLIC_API_URL is explicitly set (e.g. for mobile clients).
const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api';

export function useApi() {
  const getToken = useCallback(() => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('bf_token');
  }, []);

  const request = useCallback(async (method: string, path: string, body?: unknown) => {
    const token = getToken();
    const res = await fetch(`${API_BASE}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(err.error || `HTTP ${res.status}`);
    }
    return res.json();
  }, [getToken]);

  return {
    get:   (path: string)                  => request('GET',    path),
    post:  (path: string, body: unknown)   => request('POST',   path, body),
    patch: (path: string, body: unknown)   => request('PATCH',  path, body),
    del:   (path: string)                  => request('DELETE', path),
  };
}
