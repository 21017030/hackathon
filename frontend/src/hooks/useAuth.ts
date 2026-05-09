'use client';

import { useState, useCallback, useEffect } from 'react';
import { STORAGE_KEY } from '@/constants';
import type { User } from '@/types';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setUser(JSON.parse(raw) as User);
    } catch {
      // 파싱 실패 시 무시
    }
  }, []);

  const saveUser = useCallback((u: User) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
    setUser(u);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
  }, []);

  return { user, saveUser, logout };
}
