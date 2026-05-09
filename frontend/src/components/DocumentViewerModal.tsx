'use client';

import { useEffect, useState } from 'react';
import { X, FileText, Loader2 } from 'lucide-react';
import { getDocumentView } from '@/api/documents';
import type { DocumentView } from '@/api/documents';

interface Props {
  documentId: number;
  onClose: () => void;
}

export default function DocumentViewerModal({ documentId, onClose }: Props) {
  const [view, setView] = useState<DocumentView | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    getDocumentView(documentId)
      .then(setView)
      .catch(() => setError(true))
      .finally(() => setIsLoading(false));
  }, [documentId]);

  return (
    <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden">

        <div className="flex items-center justify-between px-8 py-5 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 bg-red-50 text-red-500 rounded-lg flex items-center justify-center shrink-0">
              <FileText size={20} />
            </div>
            <p className="font-bold text-gray-800 truncate">
              {view ? view.filename : '문서 불러오는 중...'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors shrink-0 ml-4"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-hidden">
          {isLoading && (
            <div className="h-full flex items-center justify-center">
              <Loader2 size={36} className="animate-spin text-indigo-400" />
            </div>
          )}

          {error && (
            <div className="h-full flex items-center justify-center text-gray-400 text-sm">
              문서를 불러오지 못했습니다.
            </div>
          )}

          {!isLoading && !error && view && (
            view.ext === '.pdf' && view.signed_url ? (
              <iframe
                src={view.signed_url}
                className="w-full h-full border-0"
                title={view.filename}
              />
            ) : (
              <div className="h-full overflow-y-auto px-8 py-6">
                {view.content ? (
                  <pre className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap font-sans">
                    {view.content}
                  </pre>
                ) : (
                  <p className="text-sm text-gray-400 text-center mt-20">
                    텍스트 내용을 불러올 수 없습니다.
                  </p>
                )}
              </div>
            )
          )}
        </div>

      </div>
    </div>
  );
}
