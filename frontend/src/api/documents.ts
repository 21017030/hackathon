import client from './client';
import type { Document, SimpleMessage, Source } from '@/types';

/** 사용자가 업로드한 문서 목록을 가져옵니다. */
export async function getDocuments(userId: string): Promise<Document[]> {
  const res = await client.get(`/documents/user/${userId}`);
  return res.data;
}

/** PDF 파일을 업로드하고 생성된 문서 ID를 반환합니다. */
export async function uploadDocument(
  file: File,
  userId: string,
  categoryId: number | null,
): Promise<{ documentId: number }> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('user_id', userId);
  if (categoryId !== null) formData.append('category_id', categoryId.toString());
  const res = await client.post('/documents/upload', formData);
  return { documentId: res.data.document_id };
}

/** 문서를 삭제합니다. */
export async function deleteDocument(documentId: number): Promise<void> {
  await client.delete(`/documents/${documentId}`);
}

/** 문서 뷰어용 데이터 타입 */
export interface DocumentView {
  filename: string;
  ext: string;
  signed_url: string; // 1시간 유효한 서명 URL (PDF 열람용)
  content: string;    // RAG 청크를 이어 붙인 전체 텍스트
}

/** 문서의 뷰어 데이터(서명 URL, 텍스트 내용)를 가져옵니다. */
export async function getDocumentView(documentId: number): Promise<DocumentView> {
  const res = await client.get(`/documents/${documentId}/view`);
  return res.data;
}

/** 문서 내 채팅 내역을 가져옵니다. sender_type을 'user'/'ai'로 변환합니다. */
export async function getDocumentChat(documentId: number): Promise<SimpleMessage[]> {
  const res = await client.get(`/documents/${documentId}/chat`);
  return (res.data as any[]).map(m => ({
    sender: m.sender_type === 'USER' ? 'user' : 'ai',
    content: m.content,
  }));
}

/** 문서 내 채팅 내역을 초기화합니다. */
export async function clearDocumentChat(documentId: number): Promise<void> {
  await client.delete(`/documents/${documentId}/chat`);
}

/** 특정 문서에 대해 AI에게 질문합니다. */
export async function askAboutDocument(
  documentId: number,
  content: string,
): Promise<{ answer: string }> {
  const res = await client.post(`/documents/${documentId}/ask`, { content });
  return { answer: res.data.answer };
}
