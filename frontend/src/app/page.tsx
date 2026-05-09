'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, ChevronRight, X, FileText, LogOut, LogIn, User as UserIcon } from 'lucide-react';

import Sidebar from '@/components/Sidebar';
import ExplorerView from '@/components/ExplorerView';
import ChatView from '@/components/ChatView';
import UploadModal from '@/components/UploadModal';
import DocumentViewerPane from '@/components/DocumentViewerPane';
import AuthScreen from '@/components/AuthScreen';
import { useAppData } from '@/hooks/useAppData';
import { useAuth } from '@/hooks/useAuth';
import { useChat } from '@/hooks/useChat';
import { useDocumentTabs } from '@/hooks/useDocumentTabs';
import { uploadDocument, deleteDocument, getDocuments } from '@/api/documents';
import { createCategory, deleteCategory } from '@/api/categories';
import { createSession, deleteSession } from '@/api/chat';
import { POLL_INTERVAL_MS, POLL_MAX_WAIT_MS } from '@/constants';
import type { ViewMode } from '@/types';

/**
 * 메인 애플리케이션 컴포넌트
 * 화면의 전체적인 레이아웃과 상태 관리를 담당합니다.
 */
export default function App() {
  const router = useRouter();
  const { user, saveUser, logout } = useAuth(); // 사용자 인증 관련 훅

  // UI 상태 관리
  const [viewMode, setViewMode] = useState<ViewMode>('explorer'); // 'explorer'(보관함) 또는 'chat'(채팅) 모드
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null); // 선택된 폴더 ID
  const [uploadStatus, setUploadStatus] = useState<'uploading' | 'analyzing' | null>(null); // 업로드 및 분석 상태
  const [uploadModalOpen, setUploadModalOpen] = useState(false); // 업로드 모달 오픈 여부
  const [uploadInitialCategoryId, setUploadInitialCategoryId] = useState<number | null>(null);
  const [uploadShowFolderSelect, setUploadShowFolderSelect] = useState(true);
  const [loginModalOpen, setLoginModalOpen] = useState(false); // 로그인 모달 오픈 여부

  const userId = user?.id ?? '';
  // 커스텀 훅을 통한 데이터 및 비즈니스 로직 분리
  const { categories, documents, sessions, setSessions, refresh } = useAppData(userId); // 앱 전반 데이터 (카테고리, 문서 등)
  const { messages, currentSessionId, setCurrentSessionId, sendMessage, isAsking, loadMessages } = useChat(); // 채팅 로직
  const { tabs, activeTabId, activeTab, setActiveTabId, openTab, closeTab, clearTab, askInTab } = useDocumentTabs(); // 문서 탭 관리 로직

  // 인증이 필요한 동작을 수행하기 전 체크하는 함수
  const requireAuth = (action: () => void) => {
    if (!user) { setLoginModalOpen(true); return; }
    action();
  };

  // ── 자료 업로드 로직 ──────────────────────────────────────
  const openUploadModal = (categoryId: number | null, showFolderSelect = true) => {
    requireAuth(() => {
      setUploadInitialCategoryId(categoryId);
      setUploadShowFolderSelect(showFolderSelect);
      setUploadModalOpen(true);
    });
  };

  /**
   * 서버에서 문서 분석(RAG용 임베딩)이 완료될 때까지 상태를 폴링(대기)합니다.
   */
  const pollDocumentStatus = (documentId: number): Promise<void> =>
    new Promise((resolve, reject) => {
      const start = Date.now();
      const check = async () => {
        if (Date.now() - start > POLL_MAX_WAIT_MS) { reject(new Error('시간 초과')); return; }
        const docs = await getDocuments(userId);
        const doc = docs.find(d => d.id === documentId);
        if (doc?.parsing_status === 'COMPLETED') resolve();
        else if (doc?.parsing_status === 'FAILED') reject(new Error('분석 실패'));
        else setTimeout(check, POLL_INTERVAL_MS);
      };
      setTimeout(check, POLL_INTERVAL_MS);
    });

  const handleUpload = async (file: File, categoryId: number | null) => {
    setUploadModalOpen(false);
    setUploadStatus('uploading');
    try {
      const { documentId } = await uploadDocument(file, userId, categoryId);
      setUploadStatus('analyzing'); // 서버에서 PDF 내용을 읽고 분석하는 중...
      refresh();
      await pollDocumentStatus(documentId); // 분석이 끝날 때까지 대기
      refresh();
    } catch {
      alert('업로드 또는 분석에 실패했습니다.');
    } finally {
      setUploadStatus(null);
    }
  };

  // ── 폴더 / 문서 관리 로직 ─────────────────────────────────
  const handleCreateFolder = (name: string) => {
    requireAuth(async () => {
      try {
        await createCategory(userId, name);
        refresh();
      } catch {
        alert('폴더 생성에 실패했습니다.');
      }
    });
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

  // ── 채팅 세션 로직 ────────────────────────────────────────
  const handleSessionClick = (id: number) => {
    setCurrentSessionId(id);
    setViewMode('chat');
    setActiveTabId(null);
    loadMessages(id);
  };

  const handleNewSession = (title: string) => {
    requireAuth(async () => {
      try {
        const session = await createSession(userId, title);
        setSessions(prev => [session, ...prev]);
        handleSessionClick(session.id);
      } catch {
        alert('대화방 생성에 실패했습니다.');
      }
    });
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
    requireAuth(() => {
      // 선택된 폴더가 있다면 해당 폴더 내의 문서들만 참고하여 답변하도록 설정
      const docIds = selectedCategoryId
        ? documents.filter(d => d.category_id === selectedCategoryId).map(d => d.id)
        : undefined;
      sendMessage(content, docIds);
    });
  };

  const handleHomeClick = () => {
    setViewMode('explorer');
    setSelectedCategoryId(null);
    setCurrentSessionId(null);
    setActiveTabId(null);
  };

  // ── UI 상단 빵부스러기(Breadcrumb) 계산 ────────────────────
  const currentCategoryName = categories.find(c => c.id === selectedCategoryId)?.name ?? '모든 자료';
  const currentSessionTitle = sessions.find(s => s.id === currentSessionId)?.title ?? 'AI 학습 챗';

  const breadcrumb = activeTab
    ? activeTab.filename
    : viewMode === 'explorer' ? currentCategoryName : currentSessionTitle;

  return (
    <div className="flex h-screen bg-[#F8F9FB] text-gray-800 font-sans">
      {/* 왼쪽 사이드바: 프로필, 대화방 목록, 폴더 목록 */}
      <Sidebar
        userName={user?.name ?? ''}
        userStudentId={user?.student_id ?? ''}
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
        {/* 상단 헤더: 제목 및 상단 버튼들 */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center gap-3 text-sm">
            <span className="text-gray-400">
              {activeTab ? '문서 뷰어' : viewMode === 'explorer' ? '내 보관함' : 'AI 학습 챗'}
            </span>
            <ChevronRight size={14} className="text-gray-300" />
            <span className="font-bold text-gray-700 max-w-xs truncate">{breadcrumb}</span>
          </div>
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <button
                  onClick={() => openUploadModal(selectedCategoryId)}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 transition-all shadow-sm"
                >
                  <Upload size={16} /> 자료 업로드
                </button>
                <button
                  onClick={() => router.push('/mypage')}
                  className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-indigo-600 text-sm font-semibold transition-colors"
                  title="마이페이지"
                >
                  <UserIcon size={16} /> {user.name}
                </button>
                <button
                  onClick={() => { logout(); window.location.reload(); }}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                  title="로그아웃"
                >
                  <LogOut size={18} />
                </button>
              </>
            ) : (
              <>
                <span className="text-sm text-gray-400">로그인 하세요</span>
                <button
                  onClick={() => openUploadModal(selectedCategoryId)}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 transition-all shadow-sm"
                >
                  <Upload size={16} /> 자료 업로드
                </button>
                <button
                  onClick={() => setLoginModalOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 border border-indigo-600 text-indigo-600 rounded-lg text-sm font-bold hover:bg-indigo-50 transition-all"
                >
                  <LogIn size={16} /> 로그인
                </button>
                <button
                  onClick={() => router.push('/register')}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-bold hover:bg-gray-200 transition-all"
                >
                  회원가입
                </button>
              </>
            )}
          </div>
        </header>

        {/* 문서 탭 바: 현재 열려있는 문서들 */}
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

        {/* 중앙 메인 콘텐츠 영역 */}
        {activeTabId !== null && activeTab ? (
          /* 문서 뷰어 모드: PDF 뷰어와 해당 문서 전용 채팅창 */
          <div className="flex-1 overflow-hidden">
            <DocumentViewerPane
              key={activeTabId}
              documentId={activeTabId}
              messages={activeTab.messages}
              isAsking={activeTab.isAsking}
              onSend={(content) => askInTab(activeTabId, content)}
              onClear={() => clearTab(activeTabId)}
            />
          </div>
        ) : (
          /* 일반 모드: 보관함(파일 탐색기) 또는 전체 채팅창 */
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
                onViewDocument={openTab}
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

      {/* 업로드 모달 */}
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

      {/* 로그인/회원가입 모달 */}
      {loginModalOpen && (
        <AuthScreen
          onSuccess={u => { saveUser(u); setLoginModalOpen(false); }}
          onClose={() => setLoginModalOpen(false)}
        />
      )}
    </div>
  );
}
