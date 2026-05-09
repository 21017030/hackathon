'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { STORAGE_KEY } from '@/constants';
import type { User } from '@/types';

export function useRequireAuth(): User | null {
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) { router.push('/'); return; }
      setUser(JSON.parse(raw) as User);
    } catch {
      router.push('/');
    }
  }, []);

  return user;
}
