'use client';

import { Upload } from 'lucide-react';

export default function UploadModal() {
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
