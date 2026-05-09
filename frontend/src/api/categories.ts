import client from './client';
import type { Category } from '@/types';

export async function getCategories(userId: string): Promise<Category[]> {
  const res = await client.get(`/categories/${userId}`);
  return res.data;
}

export async function createCategory(userId: string, name: string): Promise<Category> {
  const res = await client.post('/categories', { user_id: userId, name });
  return res.data;
}

export async function deleteCategory(categoryId: number): Promise<void> {
  await client.delete(`/categories/${categoryId}`);
}
