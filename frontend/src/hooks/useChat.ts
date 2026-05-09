'use client';

import { useState } from 'react';
import { getMessages, askQuestion } from '@/api/chat';
import type { Message } from '@/types';

/**
 * 채팅 세션의 메시지 목록과 질문 전송 로직을 관리하는 훅.
 */
export function useChat() {
  const [currentSessionId, setCurrentSessionId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isAsking, setIsAsking] = useState(false);

  /** 특정 세션의 메시지 내역을 서버에서 불러옵니다. */
  const loadMessages = async (sessionId: number) => {
    setMessages([]);
    const data = await getMessages(sessionId);
    setMessages(data);
  };

  /** 질문을 전송하고 AI 답변을 메시지 목록에 추가합니다. */
  const sendMessage = async (content: string, documentIds?: number[]) => {
    if (!currentSessionId || !content.trim() || isAsking) return;
    setIsAsking(true);

    // 사용자 메시지를 즉시 화면에 표시 (낙관적 업데이트)
    const tempMsg: Message = {
      id: Date.now(),
      sender_type: 'USER',
      content,
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, tempMsg]);

    try {
      const aiMsg = await askQuestion(currentSessionId, content, documentIds);
      setMessages(prev => [...prev, aiMsg]);
    } catch {
      alert('AI 응답을 가져오는데 실패했습니다.');
    } finally {
      setIsAsking(false);
    }
  };

  return { messages, currentSessionId, setCurrentSessionId, sendMessage, isAsking, loadMessages };
}
