'use client';

import { useState } from 'react';
import { Upload, ChevronRight, X, FileText } from 'lucide-react';

import Sidebar from '@/components/Sidebar';
import ExplorerView from '@/components/ExplorerView';
import ChatView from '@/components/ChatView';
import UploadModal from '@/components/UploadModal';
import DocumentViewerPane from '@/components/DocumentViewerPane';
import { useAppData } from '@/hooks/useAppData';
import { useChat } from '@/hooks/useChat';
import { uploadDocument, deleteDocument, askAboutDocument, getDocuments } from '@/api/documents';
import { createCategory, deleteCategory } from '@/api/categories';
import { createSession, deleteSession } from '@/api/chat';
import type { ViewMode, OpenTab } from '@/types';

const STUDENT_ID = '20230001';

export default function App() {
  const [viewMode, setViewMode] = useState<ViewMode>('explorer');
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [uploadStatus, setUploadStatus] = useState<'uploading' | 'analyzing' | null>(null);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadInitialCategoryId, setUploadInitialCategoryId] = useState<number | null>(null);
  const [uploadShowFolderSelect, setUploadShowFolderSelect] = useState(true);

  // 문서 탭
  const [tabs, setTabs] = useState<OpenTab[]>([]);
  const [activeTabId, setActiveTabId] = useState<number | null>(null);

  const { categories, documents, sessions, setSessions, refresh } = useAppData(STUDENT_ID);
  const { messages, currentSessionId, setCurrentSessionId, sendMessage, isAsking, loadMessages } = useChat();

  // ── 문서 탭 관리 ──────────────────────────────────────────
  const openDocumentTab = (documentId: number, filename: string) => {
    setTabs(prev => {
      if (prev.find(t => t.documentId === documentId)) return prev;
      return [...prev, { documentId, filename, messages: [], isAsking: false }];
    });
    setActiveTabId(documentId);
  };

  const closeTab = (documentId: number) => {
    setTabs(prev => {
      const remaining = prev.filter(t => t.documentId !== documentId);
      if (activeTabId === documentId) {
        const idx = prev.findIndex(t => t.documentId === documentId);
        const next = remaining[Math.max(0, idx - 1)];
        setActiveTabId(next?.documentId ?? null);
      }
      return remaining;
    });
  };

  const handleDocumentAsk = async (documentId: number, content: string) => {
    const history = tabs.find(t => t.documentId === documentId)?.messages ?? [];
    setTabs(prev => prev.map(t => t.documentId === documentId
      ? { ...t, messages: [...t.messages, { sender: 'user', content }], isAsking: true }
      : t
    ));
    try {
      const { answer, sources } = await askAboutDocument(documentId, content, history);
      setTabs(prev => prev.map(t => t.documentId === documentId
        ? { ...t, messages: [...t.messages, { sender: 'ai', content: answer, sources }], isAsking: false }
        : t
      ));
    } catch {
      setTabs(prev => prev.map(t => t.documentId === documentId
        ? { ...t, isAsking: false }
        : t
      ));
    }
  };

  // ── 업로드 ────────────────────────────────────────────────
  const openUploadModal = (categoryId: number | null, showFolderSelect = true) => {
    setUploadInitialCategoryId(categoryId);
    setUploadShowFolderSelect(showFolderSelect);
    setUploadModalOpen(true);
  };

  const pollDocumentStatus = (documentId: number): Promise<void> =>
    new Promise((resolve, reject) => {
      const MAX_WAIT = 3 * 60 * 1000;
      const start = Date.now();
      const check = async () => {
        if (Date.now() - start > MAX_WAIT) { reject(new Error('시간 초과')); return; }
        const docs = await getDocuments(STUDENT_ID);
        const doc = docs.find(d => d.id === documentId);
        if (doc?.parsing_status === 'COMPLETED') resolve();
        else if (doc?.parsing_status === 'FAILED') reject(new Error('분석 실패'));
        else setTimeout(check, 2000);
      };
      setTimeout(check, 2000);
    });

  const handleUpload = async (file: File, categoryId: number | null) => {
    setUploadModalOpen(false);
    setUploadStatus('uploading');
    try {
      const { documentId } = await uploadDocument(file, STUDENT_ID, categoryId);
      setUploadStatus('analyzing');
      refresh();
      await pollDocumentStatus(documentId);
      refresh();
    } catch {
      alert('업로드 또는 분석에 실패했습니다.');
    } finally {
      setUploadStatus(null);
    }
  };

  // ── 폴더 / 문서 ──────────────────────────────────────────
  const handleCreateFolder = async (name: string) => {
    try {
      await createCategory(STUDENT_ID, name);
      refresh();
    } catch {
      alert('폴더 생성에 실패했습니다.');
    }
  };

  const handleDeleteDocument = async (id: number) => {
    if (!confirm('문서를 삭제하시겠습니까?')) return;
    try {
      await deleteDocument(id);
      closeTab(id);
      refresh();
    } catch {
      alert('문서 삭제에 실패했습니다.');
    }
  };

  const handleDeleteFolder = async (id: number) => {
    const folderDocs = documents.filter(d => d.category_id === id);
    const msg = folderDocs.length > 0
      ? `폴더 안의 파일 ${folderDocs.length}개가 모두 삭제됩니다. 계속하시겠습니까?`
      : '폴더를 삭제하시겠습니까?';
    if (!confirm(msg)) return;
    try {
      await Promise.all(folderDocs.map(d => deleteDocument(d.id)));
      folderDocs.forEach(d => closeTab(d.id));
      await deleteCategory(id);
      refresh();
    } catch {
      alert('폴더 삭제에 실패했습니다.');
    }
  };

  // ── 채팅 세션 ─────────────────────────────────────────────
  const handleSessionClick = (id: number) => {
    setCurrentSessionId(id);
    setViewMode('chat');
    setActiveTabId(null);
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

  const handleHomeClick = () => {
    setViewMode('explorer');
    setSelectedCategoryId(null);
    setCurrentSessionId(null);
    setActiveTabId(null);
  };

  // ── 파생 값 ───────────────────────────────────────────────
  const currentCategoryName = categories.find(c => c.id === selectedCategoryId)?.name ?? '모든 자료';
  const currentSessionTitle = sessions.find(s => s.id === currentSessionId)?.title ?? 'AI 학습 챗';
  const activeTab = tabs.find(t => t.documentId === activeTabId) ?? null;

  const breadcrumb = activeTab
    ? activeTab.filename
    : viewMode === 'explorer' ? currentCategoryName : currentSessionTitle;

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
        onCategoryClick={id => { setSelectedCategoryId(id); setViewMode('explorer'); setCurrentSessionId(null); setActiveTabId(null); }}
        onHomeClick={handleHomeClick}
        onNewSession={handleNewSession}
      />

      <main className="flex-1 flex flex-col overflow-hidden">
        {/* 헤더 */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center gap-3 text-sm">
            <span className="text-gray-400">
              {activeTab ? '문서 뷰어' : viewMode === 'explorer' ? '내 보관함' : 'AI 학습 챗'}
            </span>
            <ChevronRight size={14} className="text-gray-300" />
            <span className="font-bold text-gray-700 max-w-xs truncate">{breadcrumb}</span>
          </div>
          <button
            onClick={() => openUploadModal(selectedCategoryId)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 transition-all shadow-sm"
          >
            <Upload size={16} /> 자료 업로드
          </button>
        </header>

        {/* 탭 바 */}
        {tabs.length > 0 && (
          <div className="bg-white border-b border-gray-200 flex items-end px-4 overflow-x-auto shrink-0">
            {tabs.map(tab => (
              <div
                key={tab.documentId}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 cursor-pointer whitespace-nowrap text-sm transition-colors group/tab ${
                  activeTabId === tab.documentId
                    ? 'border-indigo-600 text-indigo-700 font-bold bg-indigo-50/40'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <FileText size={13} className="shrink-0" />
                <button
                  className="max-w-[160px] truncate"
                  onClick={() => setActiveTabId(tab.documentId)}
                >
                  {tab.filename}
                </button>
                <button
                  onClick={e => { e.stopPropagation(); closeTab(tab.documentId); }}
                  className="opacity-0 group-hover/tab:opacity-100 text-gray-400 hover:text-gray-600 transition-opacity shrink-0"
                >
                  <X size={13} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* 콘텐츠 */}
        {activeTabId !== null && activeTab ? (
          <div className="flex-1 overflow-hidden">
            <DocumentViewerPane
              key={activeTabId}
              documentId={activeTabId}
              messages={activeTab.messages}
              isAsking={activeTab.isAsking}
              onSend={(content) => handleDocumentAsk(activeTabId, content)}
            />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-8">
            {viewMode === 'explorer' ? (
              <ExplorerView
                categories={categories}
                documents={documents}
                selectedCategoryId={selectedCategoryId}
                onCategorySelect={setSelectedCategoryId}
                onStartChat={() => setViewMode('chat')}
                onCreateFolder={handleCreateFolder}
                onDeleteFolder={handleDeleteFolder}
                onDeleteDocument={handleDeleteDocument}
                onViewDocument={openDocumentTab}
                onUpload={(categoryId) => openUploadModal(categoryId, false)}
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
        )}
      </main>

      {(uploadModalOpen || uploadStatus !== null) && (
        <UploadModal
          categories={categories}
          initialCategoryId={uploadInitialCategoryId}
          showFolderSelect={uploadShowFolderSelect}
          uploadStatus={uploadStatus}
          onUpload={handleUpload}
          onClose={() => setUploadModalOpen(false)}
        />
      )}
    </div>
  );
}
