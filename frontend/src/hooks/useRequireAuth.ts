'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { STORAGE_KEY } from '@/constants';
import type { User } from '@/types';

/**
 * 인증이 필요한 페이지에서 사용하는 훅.
 * localStorage에 사용자 정보가 없으면 홈('/')으로 리다이렉트합니다.
 */
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
