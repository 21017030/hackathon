import client from './client';
import type { User } from '@/types';

/** 아이디/비밀번호로 로그인합니다. */
export async function login(loginId: string, password: string): Promise<User> {
  const res = await client.post('/auth/login', { login_id: loginId, password });
  return res.data;
}

/** 신규 사용자를 등록합니다. */
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

/** 아이디 중복 여부를 확인합니다. true면 사용 가능합니다. */
export async function checkLoginId(loginId: string): Promise<boolean> {
  const res = await client.get('/auth/check-login-id', { params: { login_id: loginId } });
  return res.data.available;
}

/** 사용자 정보를 수정합니다. 변경할 필드만 포함하면 됩니다. */
export async function updateUser(
  userId: string,
  data: { student_id?: string; login_id?: string; name?: string; password?: string },
): Promise<User> {
  const res = await client.put(`/auth/users/${userId}`, data);
  return res.data;
}
