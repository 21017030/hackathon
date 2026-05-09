'use client';

import { FileText, CheckCircle2, Clock3, Upload, Trash2 } from 'lucide-react';
import type { Category, Document } from '@/types';

interface Props {
  documents: Document[];
  categories: Category[];
  selectedCategoryId: number | null;
  onUpload: (categoryId: number) => void;
  onDeleteDocument: (id: number) => void;
  onViewDocument: (id: number, filename: string) => void;
}

/** 문서 분석 상태(COMPLETED/FAILED/PENDING)를 뱃지로 표시하는 컴포넌트 */
function StatusBadge({ status }: { status: Document['parsing_status'] }) {
  if (status === 'COMPLETED') {
    return (
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 font-bold text-[10px]">
        <CheckCircle2 size={12} /> 분석완료
      </div>
    );
  }
  if (status === 'FAILED') {
    return (
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-50 text-red-600 font-bold text-[10px]">
        ❌ 분석실패
      </div>
    );
  }
  return (
    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-600 font-bold text-[10px]">
      <Clock3 size={12} className="animate-spin" style={{ animationDuration: '3s' }} /> 분석중
    </div>
  );
}

/** 선택된 카테고리 내 문서 목록을 테이블로 표시하는 컴포넌트 */
export default function DocumentTable({
  documents,
  categories,
  selectedCategoryId,
  onUpload,
  onDeleteDocument,
  onViewDocument,
}: Props) {
  const categoryName = categories.find(c => c.id === selectedCategoryId)?.name ?? '모든 자료';

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <FileText size={18} className="text-gray-400" />
          <h3 className="text-sm font-bold text-gray-600">
            {selectedCategoryId ? `${categoryName} 내 문서` : '모든 문서'}
          </h3>
        </div>
        {selectedCategoryId !== null && (
          <button
            onClick={() => onUpload(selectedCategoryId)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 rounded-xl hover:bg-indigo-100 transition-colors"
          >
            <Upload size={14} /> 파일 추가
          </button>
        )}
      </div>
      <div className="bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="bg-gray-50/50 border-b border-gray-100 text-gray-400 text-[10px] uppercase tracking-widest">
              <th className="px-6 py-5 font-bold">파일명</th>
              <th className="px-6 py-5 font-bold">상태</th>
              <th className="px-6 py-5 font-bold text-right">관리</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {documents.map(doc => (
              <tr key={doc.id} className="hover:bg-gray-50/30 transition-colors">
                <td className="px-6 py-4">
                  <button
                    onClick={() => onViewDocument(doc.id, doc.original_file_name)}
                    className="flex items-center gap-3 text-left group/doc w-full"
                  >
                    <div className="w-9 h-9 bg-red-50 text-red-500 rounded-lg flex items-center justify-center shrink-0">
                      <FileText size={20} />
                    </div>
                    <div className="overflow-hidden">
                      <p className="font-bold text-gray-700 truncate group-hover/doc:text-indigo-600 transition-colors">
                        {doc.original_file_name}
                      </p>
                      <p className="text-[10px] text-gray-400">
                        {categories.find(c => c.id === doc.category_id)?.name ?? '분류 없음'}
                      </p>
                    </div>
                  </button>
                </td>
                <td className="px-6 py-4">
                  <StatusBadge status={doc.parsing_status} />
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => onDeleteDocument(doc.id)}
                    className="p-2 bg-red-50 text-red-400 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-sm"
                    title="문서 삭제"
                  >
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
            {documents.length === 0 && (
              <tr>
                <td colSpan={3} className="px-6 py-12 text-center text-sm text-gray-400">
                  {selectedCategoryId
                    ? '이 폴더에 업로드된 문서가 없습니다.'
                    : '업로드된 문서가 없습니다.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
