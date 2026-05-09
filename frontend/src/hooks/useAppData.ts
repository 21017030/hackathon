'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { getCategories } from '@/api/categories';
import { getDocuments } from '@/api/documents';
import { getSessions } from '@/api/chat';
import type { Category, Document, ChatSession } from '@/types';

/**
 * 앱 전반에서 사용하는 데이터(카테고리, 문서, 채팅 세션)를 한 곳에서 관리하는 훅.
 * PENDING 상태 문서가 있으면 5초마다 자동으로 갱신합니다.
 */
export function useAppData(userId: string) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  // 동시 중복 요청 방지: 진행 중인 refresh가 있으면 완료 후 한 번 더 실행
  const isRefreshing = useRef(false);
  const pendingRefresh = useRef(false);

  /** 카테고리·문서·세션 데이터를 서버에서 다시 불러옵니다. */
  const refresh = useCallback(async () => {
    if (!userId) return;
    if (isRefreshing.current) {
      pendingRefresh.current = true;
      return;
    }
    isRefreshing.current = true;
    pendingRefresh.current = false;
    try {
      const [cats, docs, sess] = await Promise.allSettled([
        getCategories(userId),
        getDocuments(userId),
        getSessions(userId),
      ]);
      if (cats.status === 'fulfilled') setCategories(cats.value);
      if (docs.status === 'fulfilled') setDocuments(docs.value);
      if (sess.status === 'fulfilled') setSessions(sess.value);
    } finally {
      isRefreshing.current = false;
      if (pendingRefresh.current) refresh();
    }
  }, [userId]);

  // 사용자 ID가 바뀌면 데이터 초기 로드
  useEffect(() => {
    refresh();
  }, [refresh]);

  // PENDING 문서가 있을 때만 5초 폴링
  useEffect(() => {
    const hasPending = documents.some(d => d.parsing_status === 'PENDING');
    if (!hasPending) return;
    const timer = setInterval(refresh, 5000);
    return () => clearInterval(timer);
  }, [documents, refresh]);

  return { categories, documents, sessions, setSessions, refresh };
}
