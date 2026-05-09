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
