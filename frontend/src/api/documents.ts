import client from './client';
import type { Document, SimpleMessage, Source } from '@/types';

export async function getDocuments(studentId: string): Promise<Document[]> {
  const res = await client.get(`/documents/student/${studentId}`);
  return res.data;
}

export async function uploadDocument(
  file: File,
  studentId: string,
  categoryId: number | null,
): Promise<{ documentId: number }> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('student_id', studentId);
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

export async function askAboutDocument(
  documentId: number,
  content: string,
  history: SimpleMessage[] = [],
): Promise<{ answer: string; sources: Source[] }> {
  const res = await client.post(`/documents/${documentId}/ask`, { content, history });
  return { answer: res.data.answer, sources: res.data.sources ?? [] };
}
