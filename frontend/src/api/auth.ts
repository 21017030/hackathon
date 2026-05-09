import client from './client';
import type { User } from '@/types';

export async function login(loginId: string, password: string): Promise<User> {
  const res = await client.post('/auth/login', { login_id: loginId, password });
  return res.data;
}

export async function register(
  studentId: string,
  loginId: string,
  password: string,
  name: string,
): Promise<User> {
  const res = await client.post('/auth/register', {
    student_id: studentId,
    login_id: loginId,
    password,
    name,
  });
  return res.data;
}

export async function checkLoginId(loginId: string): Promise<boolean> {
  const res = await client.get('/auth/check-login-id', { params: { login_id: loginId } });
  return res.data.available;
}

export async function updateUser(
  userId: string,
  data: { name?: string; password?: string },
): Promise<User> {
  const res = await client.put(`/auth/users/${userId}`, data);
  return res.data;
}
