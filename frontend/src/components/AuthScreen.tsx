'use client';

import { useState } from 'react';
import { login, register } from '@/api/auth';
import type { User } from '@/types';

interface Props {
  onSuccess: (user: User) => void;
}

export default function AuthScreen({ onSuccess }: Props) {
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [loginForm, setLoginForm] = useState({ loginId: '', password: '' });
  const [registerForm, setRegisterForm] = useState({
    studentId: '',
    loginId: '',
    password: '',
    name: '',
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(loginForm.loginId, loginForm.password);
      onSuccess(user);
    } catch (err: any) {
      setError(err?.response?.data?.detail ?? '로그인에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await register(
        registerForm.studentId,
        registerForm.loginId,
        registerForm.password,
        registerForm.name,
      );
      onSuccess(user);
    } catch (err: any) {
      setError(err?.response?.data?.detail ?? '회원가입에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FB] flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-sm p-8">
        <h1 className="text-2xl font-bold text-indigo-600 text-center mb-6">VibeLRS</h1>

        <div className="flex rounded-lg bg-gray-100 p-1 mb-6">
          <button
            className={`flex-1 py-2 rounded-md text-sm font-semibold transition-colors ${
              tab === 'login' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500'
            }`}
            onClick={() => { setTab('login'); setError(''); }}
          >
            로그인
          </button>
          <button
            className={`flex-1 py-2 rounded-md text-sm font-semibold transition-colors ${
              tab === 'register' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500'
            }`}
            onClick={() => { setTab('register'); setError(''); }}
          >
            회원가입
          </button>
        </div>

        {tab === 'login' ? (
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <input
              type="text"
              placeholder="아이디"
              required
              value={loginForm.loginId}
              onChange={e => setLoginForm(f => ({ ...f, loginId: e.target.value }))}
              className="border border-gray-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-indigo-400"
            />
            <input
              type="password"
              placeholder="비밀번호"
              required
              value={loginForm.password}
              onChange={e => setLoginForm(f => ({ ...f, password: e.target.value }))}
              className="border border-gray-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-indigo-400"
            />
            {error && <p className="text-red-500 text-xs">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="bg-indigo-600 text-white rounded-lg py-2.5 text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {loading ? '로그인 중...' : '로그인'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="flex flex-col gap-4">
            <input
              type="text"
              placeholder="학번"
              required
              value={registerForm.studentId}
              onChange={e => setRegisterForm(f => ({ ...f, studentId: e.target.value }))}
              className="border border-gray-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-indigo-400"
            />
            <input
              type="text"
              placeholder="이름"
              required
              value={registerForm.name}
              onChange={e => setRegisterForm(f => ({ ...f, name: e.target.value }))}
              className="border border-gray-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-indigo-400"
            />
            <input
              type="text"
              placeholder="아이디"
              required
              value={registerForm.loginId}
              onChange={e => setRegisterForm(f => ({ ...f, loginId: e.target.value }))}
              className="border border-gray-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-indigo-400"
            />
            <input
              type="password"
              placeholder="비밀번호"
              required
              value={registerForm.password}
              onChange={e => setRegisterForm(f => ({ ...f, password: e.target.value }))}
              className="border border-gray-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-indigo-400"
            />
            {error && <p className="text-red-500 text-xs">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="bg-indigo-600 text-white rounded-lg py-2.5 text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {loading ? '처리 중...' : '회원가입'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
