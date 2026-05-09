import client from './client';
import type { Document, SimpleMessage, Source } from '@/types';

export async function getDocuments(userId: string): Promise<Document[]> {
  const res = await client.get(`/documents/user/${userId}`);
  return res.data;
}

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

export async function deleteDocument(documentId: number): Promise<void> {
  await client.delete(`/documents/${documentId}`);
}

export interface DocumentView {
  filename: string;
  ext: string;
  signed_url: string;
  content: string;
}

export async function getDocumentView(documentId: number): Promise<DocumentView> {
  const res = await client.get(`/documents/${documentId}/view`);
  return res.data;
}

export async function getDocumentChat(documentId: number): Promise<SimpleMessage[]> {
  const res = await client.get(`/documents/${documentId}/chat`);
  return (res.data as any[]).map(m => ({
    sender: m.sender_type === 'USER' ? 'user' : 'ai',
    content: m.content,
  }));
}

export async function clearDocumentChat(documentId: number): Promise<void> {
  await client.delete(`/documents/${documentId}/chat`);
}

export async function askAboutDocument(
  documentId: number,
  content: string,
): Promise<{ answer: string }> {
  const res = await client.post(`/documents/${documentId}/ask`, { content });
  return { answer: res.data.answer };
}
