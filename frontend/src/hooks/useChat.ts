'use client';

import { useState } from 'react';
import { getMessages, askQuestion } from '@/api/chat';
import type { Message } from '@/types';

export function useChat() {
  const [currentSessionId, setCurrentSessionId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isAsking, setIsAsking] = useState(false);

  const loadMessages = async (sessionId: number) => {
    setMessages([]);
    const data = await getMessages(sessionId);
    setMessages(data);
  };

  const sendMessage = async (content: string, documentIds?: number[]) => {
    if (!currentSessionId || !content.trim() || isAsking) return;
    setIsAsking(true);

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
