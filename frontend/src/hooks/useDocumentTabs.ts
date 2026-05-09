'use client';

import { useState } from 'react';
import { getDocumentChat, clearDocumentChat, askAboutDocument } from '@/api/documents';
import type { OpenTab } from '@/types';

/**
 * 문서 뷰어 탭 목록과 각 탭의 채팅 상태를 관리하는 훅.
 */
export function useDocumentTabs() {
  const [tabs, setTabs] = useState<OpenTab[]>([]);
  const [activeTabId, setActiveTabId] = useState<number | null>(null);

  /** 문서 탭을 열고 이전 채팅 내역을 불러옵니다. 이미 열려있으면 활성화만 합니다. */
  const openTab = async (documentId: number, filename: string) => {
    setActiveTabId(documentId);
    setTabs(prev => {
      if (prev.find(t => t.documentId === documentId)) return prev;
      return [...prev, { documentId, filename, messages: [], isAsking: false }];
    });
    try {
      const messages = await getDocumentChat(documentId);
      setTabs(prev => prev.map(t => t.documentId === documentId ? { ...t, messages } : t));
    } catch {
      // 로드 실패 시 빈 상태 유지
    }
  };

  /** 탭을 닫습니다. 닫힌 탭이 활성 탭이면 이전 탭으로 포커스를 이동합니다. */
  const closeTab = (documentId: number) => {
    setTabs(prev => {
      const remaining = prev.filter(t => t.documentId !== documentId);
      if (activeTabId === documentId) {
        const idx = prev.findIndex(t => t.documentId === documentId);
        const next = remaining[Math.max(0, idx - 1)];
        setActiveTabId(next?.documentId ?? null);
      }
      return remaining;
    });
  };

  /** 해당 탭의 채팅 내역을 서버에서도 삭제하고 초기화합니다. */
  const clearTab = async (documentId: number) => {
    if (!confirm('채팅 내역을 초기화하시겠습니까?')) return;
    try {
      await clearDocumentChat(documentId);
      setTabs(prev => prev.map(t => t.documentId === documentId ? { ...t, messages: [] } : t));
    } catch {
      alert('초기화에 실패했습니다.');
    }
  };

  /** 특정 탭에서 AI에게 질문을 보내고 답변을 메시지 목록에 추가합니다. */
  const askInTab = async (documentId: number, content: string) => {
    setTabs(prev => prev.map(t => t.documentId === documentId
      ? { ...t, messages: [...t.messages, { sender: 'user', content }], isAsking: true }
      : t
    ));
    try {
      const { answer } = await askAboutDocument(documentId, content);
      setTabs(prev => prev.map(t => t.documentId === documentId
        ? { ...t, messages: [...t.messages, { sender: 'ai', content: answer }], isAsking: false }
        : t
      ));
    } catch {
      setTabs(prev => prev.map(t => t.documentId === documentId ? { ...t, isAsking: false } : t));
    }
  };

  const activeTab = tabs.find(t => t.documentId === activeTabId) ?? null;

  return { tabs, activeTabId, activeTab, setActiveTabId, openTab, closeTab, clearTab, askInTab };
}
