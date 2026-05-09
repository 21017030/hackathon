'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, Folder, CheckCircle2 } from 'lucide-react';
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
          <p className="text-sm font-bold text-gray-600 mb-3">폴더 선택</p>
          {categories.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center border border-dashed border-gray-200 rounded-xl">
              폴더가 없습니다. 보관함에서 먼저 폴더를 만들어주세요.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-2 max-h-44 overflow-y-auto pr-1">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategoryId(prev => prev === cat.id ? null : cat.id)}
                  className={`flex items-center gap-2 p-3 rounded-xl border text-left text-sm transition-all ${
                    selectedCategoryId === cat.id
                      ? 'border-indigo-400 bg-indigo-50 text-indigo-700 font-bold'
                      : 'border-gray-200 hover:border-indigo-200 hover:bg-gray-50 text-gray-600'
                  }`}
                >
                  <Folder size={15} className={selectedCategoryId === cat.id ? 'text-indigo-500 shrink-0' : 'text-gray-400 shrink-0'} />
                  <span className="truncate">{cat.name}</span>
                  {selectedCategoryId === cat.id && <CheckCircle2 size={14} className="ml-auto shrink-0 text-indigo-500" />}
                </button>
              ))}
            </div>
          )}
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
