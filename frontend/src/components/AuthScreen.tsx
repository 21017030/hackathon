'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { login } from '@/api/auth';
import type { User } from '@/types';

interface Props {
  onSuccess: (user: User) => void;
  onClose?: () => void;
}

export default function AuthScreen({ onSuccess, onClose }: Props) {
  const [form, setForm] = useState({ loginId: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(form.loginId, form.password);
      onSuccess(user);
    } catch (err: any) {
      setError(err?.response?.data?.detail ?? '로그인에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const card = (
    <div className="bg-white rounded-2xl shadow-lg w-full max-w-sm p-8 relative">
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X size={18} />
        </button>
      )}
      <h1 className="text-2xl font-bold text-indigo-600 text-center mb-2">VibeLRS</h1>
      <p className="text-center text-gray-500 text-sm mb-8">로그인</p>

      <form onSubmit={handleLogin} className="flex flex-col gap-4">
        <input
          type="text"
          placeholder="아이디"
          required
          value={form.loginId}
          onChange={e => setForm(f => ({ ...f, loginId: e.target.value }))}
          className="border border-gray-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-indigo-400"
        />
        <input
          type="password"
          placeholder="비밀번호"
          required
          value={form.password}
          onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
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

      <p className="text-center text-sm text-gray-500 mt-6">
        계정이 없으신가요?{' '}
        <a href="/register" className="text-indigo-600 font-semibold hover:underline">
          회원가입
        </a>
      </p>
    </div>
  );

  if (onClose) {
    return (
      <div
        className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
        onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      >
        {card}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FB] flex items-center justify-center">
      {card}
    </div>
  );
}
