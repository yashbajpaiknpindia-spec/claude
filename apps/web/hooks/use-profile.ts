'use client';
import { useEffect, useState } from 'react';

export interface Profile {
  id: string;
  phone: string;
  fullName?: string;
  plan: string;
  credits: number;
}

export function useProfile() {
  const [profile,   setProfile]   = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('bf_user');
      if (stored) setProfile(JSON.parse(stored));
    } catch { /* ignore */ }
    setIsLoading(false);
  }, []);

  return { profile, isLoading };
}
