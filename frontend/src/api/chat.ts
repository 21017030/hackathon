import client from './client';
import type { ChatSession, Message } from '@/types';

/** 사용자의 채팅 세션 목록을 가져옵니다. */
export async function getSessions(userId: string): Promise<ChatSession[]> {
  const res = await client.get(`/chat/sessions/${userId}`);
  return res.data;
}

/** 새 채팅 세션을 생성합니다. */
export async function createSession(userId: string, title: string): Promise<ChatSession> {
  const res = await client.post('/chat/session', { user_id: userId, title });
  return res.data;
}

/** 특정 세션의 메시지 목록을 가져옵니다. */
export async function getMessages(sessionId: number): Promise<Message[]> {
  const res = await client.get(`/chat/messages/${sessionId}`);
  return res.data;
}

/**
 * AI에게 질문을 보내고 답변 메시지를 받습니다.
 * documentIds를 지정하면 해당 문서들만 검색 대상으로 사용합니다.
 */
export async function askQuestion(
  sessionId: number,
  content: string,
  documentIds?: number[],
): Promise<Message> {
  const res = await client.post('/chat/ask', {
    session_id: sessionId,
    content,
    document_ids: documentIds ?? null,
  });
  return { ...res.data.message, sources: res.data.sources ?? [] };
}

/** 채팅 세션을 삭제합니다. */
export async function deleteSession(sessionId: number): Promise<void> {
  await client.delete(`/chat/sessions/${sessionId}`);
}
