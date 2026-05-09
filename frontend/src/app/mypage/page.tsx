'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { updateUser } from '@/api/auth';
import type { User } from '@/types';

const NAME_REGEX = /^[가-힣a-zA-Z\s]+$/;
const STORAGE_KEY = 'vibe_user';

export default function MyPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  const [nameForm, setNameForm] = useState({ name: '', error: '' });
  const [pwForm, setPwForm] = useState({ password: '', passwordConfirm: '', error: '' });
  const [nameSaving, setNameSaving] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);
  const [nameSuccess, setNameSuccess] = useState(false);
  const [pwSuccess, setPwSuccess] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) { router.push('/'); return; }
      const u = JSON.parse(raw) as User;
      setUser(u);
      setNameForm(f => ({ ...f, name: u.name }));
    } catch {
      router.push('/');
    }
  }, [router]);

  const handleNameSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameForm.name.trim()) {
      setNameForm(f => ({ ...f, error: '이름을 입력해주세요.' }));
      return;
    }
    if (!NAME_REGEX.test(nameForm.name.trim())) {
      setNameForm(f => ({ ...f, error: '이름에 특수문자를 사용할 수 없습니다.' }));
      return;
    }
    if (!user) return;
    setNameSaving(true);
    setNameSuccess(false);
    try {
      const updated = await updateUser(user.id, { name: nameForm.name.trim() });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      setUser(updated);
      setNameForm(f => ({ ...f, error: '' }));
      setNameSuccess(true);
    } catch {
      setNameForm(f => ({ ...f, error: '이름 변경에 실패했습니다.' }));
    } finally {
      setNameSaving(false);
    }
  };

  const handlePwSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pwForm.password) {
      setPwForm(f => ({ ...f, error: '새 비밀번호를 입력해주세요.' }));
      return;
    }
    if (pwForm.password.length < 6) {
      setPwForm(f => ({ ...f, error: '비밀번호는 6자 이상 입력해주세요.' }));
      return;
    }
    if (!pwForm.passwordConfirm) {
      setPwForm(f => ({ ...f, error: '비밀번호 확인을 입력해주세요.' }));
      return;
    }
    if (pwForm.password !== pwForm.passwordConfirm) {
      setPwForm(f => ({ ...f, error: '비밀번호가 일치하지 않습니다.' }));
      return;
    }
    if (!user) return;
    setPwSaving(true);
    setPwSuccess(false);
    try {
      await updateUser(user.id, { password: pwForm.password });
      setPwForm({ password: '', passwordConfirm: '', error: '' });
      setPwSuccess(true);
    } catch {
      setPwForm(f => ({ ...f, error: '비밀번호 변경에 실패했습니다.' }));
    } finally {
      setPwSaving(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#F8F9FB] flex items-center justify-center py-10">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-md p-8">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => router.push('/')}
            className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <h1 className="text-xl font-bold text-gray-800">마이페이지</h1>
        </div>

        {/* 읽기 전용 정보 */}
        <div className="bg-gray-50 rounded-xl p-4 mb-6 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">학번</span>
            <span className="text-sm font-semibold text-gray-800">{user.student_id}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">아이디</span>
            <span className="text-sm font-semibold text-gray-800">{user.login_id}</span>
          </div>
        </div>

        {/* 이름 변경 */}
        <form onSubmit={handleNameSave} className="flex flex-col gap-3 mb-6">
          <h2 className="text-sm font-bold text-gray-700">이름 변경</h2>
          <input
            type="text"
            value={nameForm.name}
            onChange={e => setNameForm(f => ({ ...f, name: e.target.value, error: '' }))}
            className={`border rounded-lg px-4 py-2.5 text-sm outline-none focus:border-indigo-400 ${nameForm.error ? 'border-red-400' : 'border-gray-200'}`}
          />
          {nameForm.error && <p className="text-red-500 text-xs">{nameForm.error}</p>}
          {nameSuccess && <p className="text-green-600 text-xs">이름이 변경되었습니다.</p>}
          <button
            type="submit"
            disabled={nameSaving}
            className="bg-indigo-600 text-white rounded-lg py-2 text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {nameSaving ? '저장 중...' : '이름 저장'}
          </button>
        </form>

        <hr className="border-gray-100 mb-6" />

        {/* 비밀번호 변경 */}
        <form onSubmit={handlePwSave} className="flex flex-col gap-3">
          <h2 className="text-sm font-bold text-gray-700">비밀번호 변경</h2>
          <input
            type="password"
            placeholder="새 비밀번호 (6자 이상)"
            value={pwForm.password}
            onChange={e => setPwForm(f => ({ ...f, password: e.target.value, error: '' }))}
            className={`border rounded-lg px-4 py-2.5 text-sm outline-none focus:border-indigo-400 ${pwForm.error ? 'border-red-400' : 'border-gray-200'}`}
          />
          <input
            type="password"
            placeholder="새 비밀번호 확인"
            value={pwForm.passwordConfirm}
            onChange={e => setPwForm(f => ({ ...f, passwordConfirm: e.target.value, error: '' }))}
            className={`border rounded-lg px-4 py-2.5 text-sm outline-none focus:border-indigo-400 ${pwForm.error ? 'border-red-400' : 'border-gray-200'}`}
          />
          {pwForm.error && <p className="text-red-500 text-xs">{pwForm.error}</p>}
          {pwSuccess && <p className="text-green-600 text-xs">비밀번호가 변경되었습니다.</p>}
          <button
            type="submit"
            disabled={pwSaving}
            className="bg-indigo-600 text-white rounded-lg py-2 text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {pwSaving ? '저장 중...' : '비밀번호 저장'}
          </button>
        </form>
      </div>
    </div>
  );
}
