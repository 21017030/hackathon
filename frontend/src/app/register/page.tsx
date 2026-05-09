'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { checkLoginId, register } from '@/api/auth';

const NAME_REGEX = /^[가-힣a-zA-Z\s]+$/;
const STORAGE_KEY = 'vibe_user';

export default function RegisterPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    loginId: '',
    password: '',
    passwordConfirm: '',
    studentId: '',
    name: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loginIdStatus, setLoginIdStatus] = useState<'idle' | 'available' | 'taken'>('idle');
  const [checking, setChecking] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const set = (field: string, value: string) => {
    setForm(f => ({ ...f, [field]: value }));
    setErrors(e => ({ ...e, [field]: '' }));
    if (field === 'loginId') setLoginIdStatus('idle');
  };

  const handleCheckLoginId = async () => {
    if (!form.loginId.trim()) {
      setErrors(e => ({ ...e, loginId: '아이디를 입력해주세요.' }));
      return;
    }
    setChecking(true);
    try {
      const available = await checkLoginId(form.loginId.trim());
      setLoginIdStatus(available ? 'available' : 'taken');
      setErrors(e => ({ ...e, loginId: '' }));
    } catch {
      setLoginIdStatus('idle');
    } finally {
      setChecking(false);
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!form.loginId.trim()) {
      newErrors.loginId = '아이디를 입력해주세요.';
    } else if (loginIdStatus !== 'available') {
      newErrors.loginId = '아이디 중복확인을 완료해주세요.';
    }
    if (!form.password) {
      newErrors.password = '비밀번호를 입력해주세요.';
    } else if (form.password.length < 6) {
      newErrors.password = '비밀번호는 6자 이상 입력해주세요.';
    }
    if (!form.passwordConfirm) {
      newErrors.passwordConfirm = '비밀번호 확인을 입력해주세요.';
    } else if (form.password !== form.passwordConfirm) {
      newErrors.passwordConfirm = '비밀번호가 일치하지 않습니다.';
    }
    if (!form.studentId.trim()) newErrors.studentId = '학번을 입력해주세요.';
    if (!form.name.trim()) {
      newErrors.name = '이름을 입력해주세요.';
    } else if (!NAME_REGEX.test(form.name.trim())) {
      newErrors.name = '이름에 특수문자를 사용할 수 없습니다.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const user = await register(
        form.studentId.trim(),
        form.loginId.trim(),
        form.password,
        form.name.trim(),
      );
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
      router.push('/');
    } catch (err: any) {
      const detail = err?.response?.data?.detail ?? '';
      if (detail.includes('학번')) {
        setErrors(e => ({ ...e, studentId: '이미 등록된 학번입니다.' }));
      } else if (detail.includes('아이디')) {
        setErrors(e => ({ ...e, loginId: '이미 사용 중인 아이디입니다.' }));
        setLoginIdStatus('taken');
      } else {
        setErrors(e => ({ ...e, form: '회원가입에 실패했습니다.' }));
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FB] flex items-center justify-center py-10">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-md p-8">
        <h1 className="text-2xl font-bold text-indigo-600 text-center mb-2">VibeLRS</h1>
        <p className="text-center text-gray-500 text-sm mb-8">회원가입</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
          {/* 아이디 + 중복확인 */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold text-gray-700">아이디</label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="아이디를 입력하세요"
                value={form.loginId}
                onChange={e => set('loginId', e.target.value)}
                className={`flex-1 border rounded-lg px-4 py-2.5 text-sm outline-none focus:border-indigo-400 ${errors.loginId ? 'border-red-400' : 'border-gray-200'}`}
              />
              <button
                type="button"
                onClick={handleCheckLoginId}
                disabled={checking}
                className="px-3 py-2 border border-indigo-400 text-indigo-600 rounded-lg text-xs font-semibold hover:bg-indigo-50 disabled:opacity-50 whitespace-nowrap"
              >
                {checking ? '확인 중...' : '중복확인'}
              </button>
            </div>
            {loginIdStatus === 'available' && (
              <p className="text-green-600 text-xs">사용 가능한 아이디입니다.</p>
            )}
            {loginIdStatus === 'taken' && (
              <p className="text-red-500 text-xs">이미 사용 중인 아이디입니다.</p>
            )}
            {errors.loginId && loginIdStatus === 'idle' && (
              <p className="text-red-500 text-xs">{errors.loginId}</p>
            )}
          </div>

          {/* 비밀번호 */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold text-gray-700">비밀번호</label>
            <input
              type="password"
              placeholder="6자 이상 입력하세요"
              value={form.password}
              onChange={e => set('password', e.target.value)}
              className={`border rounded-lg px-4 py-2.5 text-sm outline-none focus:border-indigo-400 ${errors.password ? 'border-red-400' : 'border-gray-200'}`}
            />
            {errors.password && <p className="text-red-500 text-xs">{errors.password}</p>}
          </div>

          {/* 비밀번호 확인 */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold text-gray-700">비밀번호 확인</label>
            <input
              type="password"
              placeholder="비밀번호를 다시 입력하세요"
              value={form.passwordConfirm}
              onChange={e => set('passwordConfirm', e.target.value)}
              className={`border rounded-lg px-4 py-2.5 text-sm outline-none focus:border-indigo-400 ${errors.passwordConfirm ? 'border-red-400' : 'border-gray-200'}`}
            />
            {errors.passwordConfirm && (
              <p className="text-red-500 text-xs">{errors.passwordConfirm}</p>
            )}
          </div>

          {/* 학번 */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold text-gray-700">학번</label>
            <input
              type="text"
              placeholder="학번을 입력하세요"
              value={form.studentId}
              onChange={e => set('studentId', e.target.value)}
              className={`border rounded-lg px-4 py-2.5 text-sm outline-none focus:border-indigo-400 ${errors.studentId ? 'border-red-400' : 'border-gray-200'}`}
            />
            {errors.studentId && <p className="text-red-500 text-xs">{errors.studentId}</p>}
          </div>

          {/* 이름 */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold text-gray-700">이름</label>
            <input
              type="text"
              placeholder="이름을 입력하세요"
              value={form.name}
              onChange={e => set('name', e.target.value)}
              className={`border rounded-lg px-4 py-2.5 text-sm outline-none focus:border-indigo-400 ${errors.name ? 'border-red-400' : 'border-gray-200'}`}
            />
            {errors.name && <p className="text-red-500 text-xs">{errors.name}</p>}
          </div>

          {errors.form && <p className="text-red-500 text-xs text-center">{errors.form}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="bg-indigo-600 text-white rounded-lg py-2.5 text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors mt-1"
          >
            {submitting ? '처리 중...' : '회원가입'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          이미 계정이 있으신가요?{' '}
          <button
            onClick={() => router.push('/')}
            className="text-indigo-600 font-semibold hover:underline"
          >
            로그인
          </button>
        </p>
      </div>
    </div>
  );
}
