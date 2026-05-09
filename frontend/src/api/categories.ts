import client from './client';
import type { Category } from '@/types';

/** 사용자의 카테고리(폴더) 목록을 가져옵니다. */
export async function getCategories(userId: string): Promise<Category[]> {
  const res = await client.get(`/categories/${userId}`);
  return res.data;
}

/** 새 카테고리(폴더)를 생성합니다. */
export async function createCategory(userId: string, name: string): Promise<Category> {
  const res = await client.post('/categories', { user_id: userId, name });
  return res.data;
}

/** 카테고리를 삭제합니다. 내부에 문서가 있으면 서버에서 거부됩니다. */
export async function deleteCategory(categoryId: number): Promise<void> {
  await client.delete(`/categories/${categoryId}`);
}
