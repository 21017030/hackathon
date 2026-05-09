'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { checkLoginId, updateUser } from '@/api/auth';
import { NAME_REGEX } from '@/constants';
import { getApiErrorDetail } from '@/utils/apiError';
import { useRequireAuth } from '@/hooks/useRequireAuth';

export default function EditProfilePage() {
  const router = useRouter();
  const user = useRequireAuth();
  const [form, setForm] = useState({ studentId: '', loginId: '', name: '' });
  const [original, setOriginal] = useState({ studentId: '', loginId: '', name: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loginIdStatus, setLoginIdStatus] = useState<'idle' | 'available' | 'taken' | 'same'>('same');
  const [checking, setChecking] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    const init = { studentId: user.student_id, loginId: user.login_id, name: user.name };
    setForm(init);
    setOriginal(init);
  }, [user]);

  const set = (field: string, value: string) => {
    setForm(f => ({ ...f, [field]: value }));
    setErrors(e => ({ ...e, [field]: '' }));
    if (field === 'loginId') {
      setLoginIdStatus(value === original.loginId ? 'same' : 'idle');
    }
  };

  const handleCheckLoginId = async () => {
    if (!form.loginId.trim()) {
      setErrors(e => ({ ...e, loginId: '아이디를 입력해주세요.' }));
      return;
    }
    if (form.loginId.trim() === original.loginId) {
      setLoginIdStatus('same');
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

  const hasChanged = () =>
    form.studentId.trim() !== original.studentId ||
    form.loginId.trim() !== original.loginId ||
    form.name.trim() !== original.name;

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!form.studentId.trim()) newErrors.studentId = '학번을 입력해주세요.';

    if (!form.loginId.trim()) {
      newErrors.loginId = '아이디를 입력해주세요.';
    } else if (form.loginId.trim() !== original.loginId && loginIdStatus !== 'available') {
      newErrors.loginId = '아이디 중복확인을 완료해주세요.';
    }

    if (!form.name.trim()) {
      newErrors.name = '이름을 입력해주세요.';
    } else if (!NAME_REGEX.test(form.name.trim())) {
      newErrors.name = '이름에 특수문자를 사용할 수 없습니다.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasChanged()) {
      router.push('/mypage');
      return;
    }
    if (!validate()) return;
    if (!user) return;

    setSaving(true);
    const payload: Record<string, string> = {};
    if (form.studentId.trim() !== original.studentId) payload.student_id = form.studentId.trim();
    if (form.loginId.trim() !== original.loginId) payload.login_id = form.loginId.trim();
    if (form.name.trim() !== original.name) payload.name = form.name.trim();

    try {
      const updated = await updateUser(user.id, payload);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      router.push('/mypage');
    } catch (err: unknown) {
      const detail = getApiErrorDetail(err);
      if (detail.includes('학번')) setErrors(e => ({ ...e, studentId: '이미 등록된 학번입니다.' }));
      else if (detail.includes('아이디')) { setErrors(e => ({ ...e, loginId: '이미 사용 중인 아이디입니다.' })); setLoginIdStatus('taken'); }
      else setErrors(e => ({ ...e, form: '수정에 실패했습니다.' }));
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#F8F9FB] flex items-center justify-center py-10">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-md p-8">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => { router.push('/mypage'); }}
            className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <h1 className="text-xl font-bold text-gray-800">사용자 정보 수정</h1>
        </div>

        <form onSubmit={handleSave} className="flex flex-col gap-5" noValidate>
          {/* 아이디 */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold text-gray-700">아이디</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={form.loginId}
                onChange={e => set('loginId', e.target.value)}
                className={`flex-1 border rounded-lg px-4 py-2.5 text-sm outline-none focus:border-indigo-400 ${errors.loginId ? 'border-red-400' : 'border-gray-200'}`}
              />
              <button
                type="button"
                onClick={handleCheckLoginId}
                disabled={checking || form.loginId.trim() === original.loginId}
                className="px-3 py-2 border border-indigo-400 text-indigo-600 rounded-lg text-xs font-semibold hover:bg-indigo-50 disabled:opacity-40 whitespace-nowrap"
              >
                {checking ? '확인 중...' : '중복확인'}
              </button>
            </div>
            {loginIdStatus === 'available' && <p className="text-green-600 text-xs">사용 가능한 아이디입니다.</p>}
            {loginIdStatus === 'taken' && <p className="text-red-500 text-xs">이미 사용 중인 아이디입니다.</p>}
            {errors.loginId && loginIdStatus === 'idle' && <p className="text-red-500 text-xs">{errors.loginId}</p>}
          </div>

          {/* 이름 */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold text-gray-700">이름</label>
            <input
              type="text"
              value={form.name}
              onChange={e => set('name', e.target.value)}
              className={`border rounded-lg px-4 py-2.5 text-sm outline-none focus:border-indigo-400 ${errors.name ? 'border-red-400' : 'border-gray-200'}`}
            />
            {errors.name && <p className="text-red-500 text-xs">{errors.name}</p>}
          </div>

          {/* 학번 */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold text-gray-700">학번</label>
            <input
              type="text"
              value={form.studentId}
              onChange={e => set('studentId', e.target.value)}
              className={`border rounded-lg px-4 py-2.5 text-sm outline-none focus:border-indigo-400 ${errors.studentId ? 'border-red-400' : 'border-gray-200'}`}
            />
            {errors.studentId && <p className="text-red-500 text-xs">{errors.studentId}</p>}
          </div>

          {errors.form && <p className="text-red-500 text-xs text-center">{errors.form}</p>}

          <div className="flex gap-3 mt-1">
            <button
              type="button"
              onClick={() => { router.push('/mypage'); }}
              className="flex-1 border border-gray-300 text-gray-600 rounded-lg py-2.5 text-sm font-semibold hover:bg-gray-50 transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-indigo-600 text-white rounded-lg py-2.5 text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {saving ? '저장 중...' : '수정'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
