'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import { updateUser } from '@/api/auth';
import { useRequireAuth } from '@/hooks/useRequireAuth';

/**
 * 마이페이지 컴포넌트.
 * 사용자 정보 확인, 정보 수정 페이지 이동, 비밀번호 변경 기능을 제공합니다.
 */
export default function MyPage() {
  const router = useRouter();
  const user = useRequireAuth();
  const [pwForm, setPwForm] = useState({ password: '', passwordConfirm: '', error: '', success: false });
  const [pwSaving, setPwSaving] = useState(false);

  /** 비밀번호 변경 폼 제출 핸들러. 유효성 검사 후 API를 호출합니다. */
  const handlePwSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pwForm.password) {
      setPwForm(f => ({ ...f, error: '새 비밀번호를 입력해주세요.', success: false }));
      return;
    }
    if (pwForm.password.length < 6) {
      setPwForm(f => ({ ...f, error: '비밀번호는 6자 이상 입력해주세요.', success: false }));
      return;
    }
    if (!pwForm.passwordConfirm) {
      setPwForm(f => ({ ...f, error: '비밀번호 확인을 입력해주세요.', success: false }));
      return;
    }
    if (pwForm.password !== pwForm.passwordConfirm) {
      setPwForm(f => ({ ...f, error: '비밀번호가 일치하지 않습니다.', success: false }));
      return;
    }
    if (!user) return;
    setPwSaving(true);
    try {
      await updateUser(user.id, { password: pwForm.password });
      setPwForm({ password: '', passwordConfirm: '', error: '', success: true });
    } catch {
      setPwForm(f => ({ ...f, error: '비밀번호 변경에 실패했습니다.', success: false }));
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

        {/* 사용자 정보 */}
        <div className="bg-gray-50 rounded-xl p-4 mb-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">아이디</span>
            <span className="text-sm font-semibold text-gray-800">{user.login_id}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">이름</span>
            <span className="text-sm font-semibold text-gray-800">{user.name}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">학번</span>
            <span className="text-sm font-semibold text-gray-800">{user.student_id}</span>
          </div>
        </div>

        {/* 사용자 정보 수정 버튼 */}
        <button
          onClick={() => router.push('/mypage/edit')}
          className="w-full flex items-center justify-between px-4 py-3 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors mb-6"
        >
          <span>사용자 정보 수정</span>
          <ChevronRight size={16} className="text-gray-400" />
        </button>

        <hr className="border-gray-100 mb-6" />

        {/* 비밀번호 변경 */}
        <form onSubmit={handlePwSave} className="flex flex-col gap-3">
          <h2 className="text-sm font-bold text-gray-700">비밀번호 변경</h2>
          <input
            type="password"
            placeholder="새 비밀번호 (6자 이상)"
            value={pwForm.password}
            onChange={e => setPwForm(f => ({ ...f, password: e.target.value, error: '', success: false }))}
            className={`border rounded-lg px-4 py-2.5 text-sm outline-none focus:border-indigo-400 ${pwForm.error ? 'border-red-400' : 'border-gray-200'}`}
          />
          <input
            type="password"
            placeholder="새 비밀번호 확인"
            value={pwForm.passwordConfirm}
            onChange={e => setPwForm(f => ({ ...f, passwordConfirm: e.target.value, error: '', success: false }))}
            className={`border rounded-lg px-4 py-2.5 text-sm outline-none focus:border-indigo-400 ${pwForm.error ? 'border-red-400' : 'border-gray-200'}`}
          />
          {pwForm.error && <p className="text-red-500 text-xs">{pwForm.error}</p>}
          {pwForm.success && <p className="text-green-600 text-xs">비밀번호가 변경되었습니다.</p>}
          <button
            type="submit"
            disabled={pwSaving}
            className="bg-indigo-600 text-white rounded-lg py-2 text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {pwSaving ? '저장 중...' : '비밀번호 변경'}
          </button>
        </form>
      </div>
    </div>
  );
}
