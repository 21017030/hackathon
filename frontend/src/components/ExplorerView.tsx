'use client';

import { useState } from 'react';
import { Folder, FileText, CheckCircle2, Clock3, Plus, Upload, X, Trash2 } from 'lucide-react';
import type { Category, Document } from '@/types';

interface Props {
  categories: Category[];
  documents: Document[];
  selectedCategoryId: number | null;
  onCategorySelect: (id: number) => void;
  onStartChat: () => void;
  onCreateFolder: (name: string) => void;
  onUpload: (categoryId: number | null) => void;
  onDeleteFolder: (id: number) => void;
}

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

export default function ExplorerView({
  categories,
  documents,
  selectedCategoryId,
  onCategorySelect,
  onStartChat,
  onCreateFolder,
  onUpload,
  onDeleteFolder,
}: Props) {
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  const visibleDocs = selectedCategoryId === null
    ? documents
    : documents.filter(d => d.category_id === selectedCategoryId);

  const categoryName = categories.find(c => c.id === selectedCategoryId)?.name ?? '모든 자료';

  const handleCreateFolder = () => {
    const name = newFolderName.trim();
    if (!name) return;
    onCreateFolder(name);
    setNewFolderName('');
    setIsCreatingFolder(false);
  };

  return (
    <div className="max-w-6xl mx-auto">
      {selectedCategoryId === null && (
        <div className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Folder size={18} className="text-gray-400" />
              <h3 className="text-sm font-bold text-gray-600">폴더</h3>
            </div>
            {!isCreatingFolder && (
              <button
                onClick={() => setIsCreatingFolder(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 rounded-xl hover:bg-indigo-100 transition-colors"
              >
                <Plus size={14} /> 새 폴더
              </button>
            )}
          </div>

          {isCreatingFolder && (
            <div className="flex items-center gap-2 mb-4 p-3 bg-indigo-50 border border-indigo-200 rounded-2xl">
              <Folder size={18} className="text-indigo-400 shrink-0" />
              <input
                autoFocus
                value={newFolderName}
                onChange={e => setNewFolderName(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleCreateFolder();
                  if (e.key === 'Escape') { setIsCreatingFolder(false); setNewFolderName(''); }
                }}
                placeholder="폴더 이름 입력..."
                className="flex-1 bg-transparent text-sm font-bold text-indigo-800 placeholder-indigo-300 focus:outline-none"
              />
              <button
                onClick={handleCreateFolder}
                disabled={!newFolderName.trim()}
                className="px-3 py-1 text-xs font-bold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-indigo-200 transition-colors"
              >
                만들기
              </button>
              <button
                onClick={() => { setIsCreatingFolder(false); setNewFolderName(''); }}
                className="p-1 text-indigo-400 hover:text-indigo-600 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {categories.map(cat => (
              <div
                key={cat.id}
                className="p-4 bg-white border border-gray-200 rounded-2xl cursor-pointer transition-all flex items-center gap-4 group hover:border-indigo-300 hover:shadow-md relative"
              >
                <div
                  className="flex items-center gap-4 flex-1 min-w-0"
                  onClick={() => onCategorySelect(cat.id)}
                >
                  <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-500 group-hover:bg-indigo-100 flex items-center justify-center transition-colors shrink-0">
                    <Folder size={24} />
                  </div>
                  <div className="overflow-hidden">
                    <p className="font-bold text-sm truncate">{cat.name}</p>
                    <p className="text-[11px] text-gray-400">
                      파일 {documents.filter(d => d.category_id === cat.id).length}개
                    </p>
                  </div>
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 shrink-0">
                  <button
                    onClick={e => { e.stopPropagation(); onUpload(cat.id); }}
                    className="p-2 rounded-xl bg-indigo-50 text-indigo-500 hover:bg-indigo-600 hover:text-white transition-colors"
                    title="파일 추가"
                  >
                    <Upload size={15} />
                  </button>
                  <button
                    onClick={e => { e.stopPropagation(); onDeleteFolder(cat.id); }}
                    className="p-2 rounded-xl bg-red-50 text-red-400 hover:bg-red-500 hover:text-white transition-colors"
                    title="폴더 삭제"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
            {categories.length === 0 && !isCreatingFolder && (
              <p className="text-sm text-gray-400 col-span-4 py-8 text-center">
                폴더가 없습니다. 새 폴더를 만들어 자료를 정리해보세요.
              </p>
            )}
          </div>
        </div>
      )}

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
              {visibleDocs.map(doc => (
                <tr key={doc.id} className="hover:bg-gray-50/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-red-50 text-red-500 rounded-lg flex items-center justify-center">
                        <FileText size={20} />
                      </div>
                      <div className="overflow-hidden">
                        <p className="font-bold text-gray-700 truncate">{doc.original_file_name}</p>
                        <p className="text-[10px] text-gray-400">
                          {categories.find(c => c.id === doc.category_id)?.name ?? '분류 없음'}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={doc.parsing_status} />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={onStartChat}
                      className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-bold hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                    >
                      질문하기
                    </button>
                  </td>
                </tr>
              ))}
              {visibleDocs.length === 0 && (
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
    </div>
  );
}
