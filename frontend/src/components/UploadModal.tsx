'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, Folder, CheckCircle2, ChevronDown } from 'lucide-react';
import type { Category } from '@/types';

interface Props {
  categories: Category[];
  initialCategoryId: number | null;
  isUploading: boolean;
  onUpload: (file: File, categoryId: number | null) => void;
  onClose: () => void;
}

export default function UploadModal({ categories, initialCategoryId, isUploading, onUpload, onClose }: Props) {
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(initialCategoryId);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const onDrop = useCallback((files: File[]) => {
    if (files[0]) setSelectedFile(files[0]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, multiple: false });

  if (isUploading) {
    return (
      <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-md z-50 flex items-center justify-center">
        <div className="bg-white p-12 rounded-[3rem] shadow-2xl text-center max-w-md mx-auto">
          <div className="relative w-32 h-32 mx-auto mb-8">
            <div className="absolute inset-0 border-[6px] border-indigo-50 rounded-full" />
            <div className="absolute inset-0 border-[6px] border-indigo-600 rounded-full border-t-transparent animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center text-indigo-600">
              <Upload size={48} />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">자료 분석 중...</h2>
          <p className="text-gray-500">지식을 정리하고 있습니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-md z-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl max-w-lg w-full mx-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">자료 업로드</h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="mb-6">
          <p className="text-sm font-bold text-gray-600 mb-2">폴더 선택</p>
          <div className="relative">
            <Folder size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <select
              value={selectedCategoryId ?? ''}
              onChange={e => setSelectedCategoryId(e.target.value ? Number(e.target.value) : null)}
              className="w-full appearance-none pl-9 pr-9 py-3 border border-gray-200 rounded-xl text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition-all"
            >
              <option value="">폴더 없음</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
            <ChevronDown size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </div>

        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
            isDragActive
              ? 'border-indigo-400 bg-indigo-50'
              : selectedFile
              ? 'border-emerald-400 bg-emerald-50'
              : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'
          }`}
        >
          <input {...getInputProps()} />
          {selectedFile ? (
            <div className="text-emerald-600">
              <CheckCircle2 size={32} className="mx-auto mb-2" />
              <p className="font-bold text-sm">{selectedFile.name}</p>
              <p className="text-xs text-emerald-500 mt-1">클릭하여 파일 변경</p>
            </div>
          ) : (
            <div className="text-gray-400">
              <Upload size={32} className="mx-auto mb-2" />
              <p className="text-sm font-bold">{isDragActive ? '여기에 놓으세요' : '파일을 드래그하거나 클릭하여 선택'}</p>
              <p className="text-xs mt-1">PDF, DOCX, TXT 등 지원</p>
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-bold text-sm hover:bg-gray-50 transition-colors"
          >
            취소
          </button>
          <button
            onClick={() => selectedFile && onUpload(selectedFile, selectedCategoryId)}
            disabled={!selectedFile}
            className="flex-1 py-3 rounded-xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 disabled:bg-gray-200 disabled:text-gray-400 transition-all"
          >
            업로드
          </button>
        </div>
      </div>
    </div>
  );
}
