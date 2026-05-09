import client from './client';
import type { ChatSession, Message } from '@/types';

export async function getSessions(userId: string): Promise<ChatSession[]> {
  const res = await client.get(`/chat/sessions/${userId}`);
  return res.data;
}

export async function createSession(userId: string, title: string): Promise<ChatSession> {
  const res = await client.post('/chat/session', { user_id: userId, title });
  return res.data;
}

export async function getMessages(sessionId: number): Promise<Message[]> {
  const res = await client.get(`/chat/messages/${sessionId}`);
  return res.data;
}

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

export async function deleteSession(sessionId: number): Promise<void> {
  await client.delete(`/chat/sessions/${sessionId}`);
}
