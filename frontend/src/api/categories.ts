import client from './client';
import type { Category } from '@/types';

export async function getCategories(studentId: string): Promise<Category[]> {
  const res = await client.get(`/categories/${studentId}`);
  return res.data;
}

export async function createCategory(studentId: string, name: string): Promise<Category> {
  const res = await client.post('/categories', { student_id: studentId, name });
  return res.data;
}

export async function deleteCategory(categoryId: number): Promise<void> {
  await client.delete(`/categories/${categoryId}`);
}
