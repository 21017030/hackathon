'use client';

import { useState } from 'react';
import { Folder, Plus, Upload, X, Trash2 } from 'lucide-react';
import type { Category, Document } from '@/types';

interface Props {
  categories: Category[];
  documents: Document[];
  onCategorySelect: (id: number) => void;
  onCreateFolder: (name: string) => void;
  onUpload: (categoryId: number) => void;
  onDeleteFolder: (id: number) => void;
}

/** 카테고리(폴더) 목록을 그리드로 표시하고 생성/삭제/파일 추가를 지원하는 컴포넌트 */
export default function FolderGrid({
  categories,
  documents,
  onCategorySelect,
  onCreateFolder,
  onUpload,
  onDeleteFolder,
}: Props) {
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');

  /** 입력된 이름으로 폴더를 생성하고 입력창을 닫습니다. */
  const handleCreate = () => {
    const name = newName.trim();
    if (!name) return;
    onCreateFolder(name);
    setNewName('');
    setIsCreating(false);
  };

  return (
    <div className="mb-10">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Folder size={18} className="text-gray-400" />
          <h3 className="text-sm font-bold text-gray-600">폴더</h3>
        </div>
        {!isCreating && (
          <button
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 rounded-xl hover:bg-indigo-100 transition-colors"
          >
            <Plus size={14} /> 새 폴더
          </button>
        )}
      </div>

      {isCreating && (
        <div className="flex items-center gap-2 mb-4 p-3 bg-indigo-50 border border-indigo-200 rounded-2xl">
          <Folder size={18} className="text-indigo-400 shrink-0" />
          <input
            autoFocus
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') handleCreate();
              if (e.key === 'Escape') { setIsCreating(false); setNewName(''); }
            }}
            placeholder="폴더 이름 입력..."
            className="flex-1 bg-transparent text-sm font-bold text-indigo-800 placeholder-indigo-300 focus:outline-none"
          />
          <button
            onClick={handleCreate}
            disabled={!newName.trim()}
            className="px-3 py-1 text-xs font-bold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-indigo-200 transition-colors"
          >
            만들기
          </button>
          <button
            onClick={() => { setIsCreating(false); setNewName(''); }}
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
        {categories.length === 0 && !isCreating && (
          <p className="text-sm text-gray-400 col-span-4 py-8 text-center">
            폴더가 없습니다. 새 폴더를 만들어 자료를 정리해보세요.
          </p>
        )}
      </div>
    </div>
  );
}
