'use client';

import { useState, useEffect, useCallback } from 'react';
import { getCategories } from '@/api/categories';
import { getDocuments } from '@/api/documents';
import { getSessions } from '@/api/chat';
import type { Category, Document, ChatSession } from '@/types';

export function useAppData(studentId: string) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [sessions, setSessions] = useState<ChatSession[]>([]);

  const refresh = useCallback(async () => {
    const [cats, docs, sess] = await Promise.allSettled([
      getCategories(studentId),
      getDocuments(studentId),
      getSessions(studentId),
    ]);
    if (cats.status === 'fulfilled') setCategories(cats.value);
    if (docs.status === 'fulfilled') setDocuments(docs.value);
    if (sess.status === 'fulfilled') setSessions(sess.value);
  }, [studentId]);

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
