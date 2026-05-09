import client from './client';
import type { Document } from '@/types';

export async function getDocuments(studentId: string): Promise<Document[]> {
  const res = await client.get(`/documents/student/${studentId}`);
  return res.data;
}

export async function uploadDocument(
  file: File,
  studentId: string,
  categoryId: number | null,
): Promise<void> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('student_id', studentId);
  if (categoryId !== null) formData.append('category_id', categoryId.toString());
  await client.post('/documents/upload', formData);
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

export async function askAboutDocument(documentId: number, content: string): Promise<string> {
  const res = await client.post(`/documents/${documentId}/ask`, { content });
  return res.data.answer;
}
