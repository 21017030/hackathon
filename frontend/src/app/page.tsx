'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, ChevronRight } from 'lucide-react';

import Sidebar from '@/components/Sidebar';
import ExplorerView from '@/components/ExplorerView';
import ChatView from '@/components/ChatView';
import UploadModal from '@/components/UploadModal';
import { useAppData } from '@/hooks/useAppData';
import { useChat } from '@/hooks/useChat';
import { uploadDocument } from '@/api/documents';
import { createSession, deleteSession } from '@/api/chat';
import type { ViewMode } from '@/types';

const STUDENT_ID = '20230001';

export default function App() {
  const [viewMode, setViewMode] = useState<ViewMode>('explorer');
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const { categories, documents, sessions, setSessions, refresh } = useAppData(STUDENT_ID);
  const { messages, currentSessionId, setCurrentSessionId, sendMessage, isAsking, loadMessages } = useChat();

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!acceptedFiles.length) return;
    setIsUploading(true);
    try {
      await uploadDocument(acceptedFiles[0], STUDENT_ID, selectedCategoryId);
      refresh();
    } catch {
      alert('업로드에 실패했습니다.');
    } finally {
      setIsUploading(false);
    }
  }, [selectedCategoryId, refresh]);

  const { getRootProps, getInputProps } = useDropzone({ onDrop, multiple: false });

  const handleSessionClick = (id: number) => {
    setCurrentSessionId(id);
    setViewMode('chat');
    loadMessages(id);
  };

  const handleNewSession = async (title: string) => {
    try {
      const session = await createSession(STUDENT_ID, title);
      setSessions(prev => [session, ...prev]);
      handleSessionClick(session.id);
    } catch {
      alert('대화방 생성에 실패했습니다.');
    }
  };

  const handleSessionDelete = async (id: number) => {
    try {
      await deleteSession(id);
      setSessions(prev => prev.filter(s => s.id !== id));
      if (currentSessionId === id) {
        setCurrentSessionId(null);
        setViewMode('explorer');
      }
    } catch {
      alert('채팅방 삭제에 실패했습니다.');
    }
  };

  const handleSend = (content: string) => {
    const docIds = selectedCategoryId
      ? documents.filter(d => d.category_id === selectedCategoryId).map(d => d.id)
      : undefined;
    sendMessage(content, docIds);
  };

  const currentCategoryName = categories.find(c => c.id === selectedCategoryId)?.name ?? '모든 자료';
  const currentSessionTitle = sessions.find(s => s.id === currentSessionId)?.title ?? 'AI 학습 챗';

  return (
    <div className="flex h-screen bg-[#F8F9FB] text-gray-800 font-sans">
      <Sidebar
        studentId={STUDENT_ID}
        sessions={sessions}
        categories={categories}
        currentSessionId={currentSessionId}
        selectedCategoryId={selectedCategoryId}
        viewMode={viewMode}
        onSessionClick={handleSessionClick}
        onSessionDelete={handleSessionDelete}
        onCategoryClick={id => { setSelectedCategoryId(id); setViewMode('explorer'); setCurrentSessionId(null); }}
        onHomeClick={() => { setViewMode('explorer'); setSelectedCategoryId(null); setCurrentSessionId(null); }}
        onNewSession={handleNewSession}
      />

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8">
          <div className="flex items-center gap-3 text-sm">
            <span className="text-gray-400">{viewMode === 'explorer' ? '내 보관함' : 'AI 학습 챗'}</span>
            <ChevronRight size={14} className="text-gray-300" />
            <span className="font-bold text-gray-700">
              {viewMode === 'explorer' ? currentCategoryName : currentSessionTitle}
            </span>
          </div>
          <button
            {...getRootProps()}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 transition-all shadow-sm"
          >
            <input {...getInputProps()} />
            <Upload size={16} /> 자료 업로드
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-8">
          {viewMode === 'explorer' ? (
            <ExplorerView
              categories={categories}
              documents={documents}
              selectedCategoryId={selectedCategoryId}
              onCategorySelect={setSelectedCategoryId}
              onStartChat={() => setViewMode('chat')}
            />
          ) : (
            <ChatView
              messages={messages}
              currentSessionId={currentSessionId}
              isAsking={isAsking}
              onSend={handleSend}
            />
          )}
        </div>
      </main>

      {isUploading && <UploadModal />}
    </div>
  );
}
