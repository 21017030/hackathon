'use client';

import { useState } from 'react';
import { Plus, MessageSquare, Folder, User, HardDrive, ChevronDown, Trash2 } from 'lucide-react';
import type { Category, ChatSession, ViewMode } from '@/types';

interface Props {
  userId: string;
  userName: string;
  userStudentId: string;
  sessions: ChatSession[];
  categories: Category[];
  currentSessionId: number | null;
  selectedCategoryId: number | null;
  viewMode: ViewMode;
  onSessionClick: (id: number) => void;
  onSessionDelete: (id: number) => void;
  onCategoryClick: (id: number) => void;
  onHomeClick: () => void;
  onNewSession: (title: string) => void;
}

export default function Sidebar({
  userId: _userId,
  userName,
  userStudentId,
  sessions,
  categories,
  currentSessionId,
  selectedCategoryId,
  viewMode,
  onSessionClick,
  onSessionDelete,
  onCategoryClick,
  onHomeClick,
  onNewSession,
}: Props) {
  const [isCategoriesExpanded, setIsCategoriesExpanded] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');

  const handleCreate = () => {
    const title = newTitle.trim() || '새로운 학습 대화';
    onNewSession(title);
    setNewTitle('');
    setIsCreating(false);
  };

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col shadow-sm">
      <div className="p-6">
        <div
          className="flex items-center gap-2 mb-8 cursor-pointer"
          onClick={onHomeClick}
        >
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">V</div>
          <span className="text-xl font-bold tracking-tight text-indigo-900">VibeLRS</span>
        </div>

        <nav className="space-y-1">
          <button
            onClick={onHomeClick}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              viewMode === 'explorer' && selectedCategoryId === null
                ? 'bg-indigo-50 text-indigo-700 font-bold'
                : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            <HardDrive size={18} />
            <span>내 보관함</span>
          </button>

          {isCreating ? (
            <div className="flex flex-col gap-1 mt-2">
              <input
                autoFocus
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleCreate();
                  if (e.key === 'Escape') { setIsCreating(false); setNewTitle(''); }
                }}
                placeholder="대화 제목 입력..."
                className="w-full text-sm px-3 py-2 border border-indigo-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
              <div className="flex gap-1">
                <button
                  onClick={handleCreate}
                  className="flex-1 text-xs py-1.5 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700"
                >
                  만들기
                </button>
                <button
                  onClick={() => { setIsCreating(false); setNewTitle(''); }}
                  className="flex-1 text-xs py-1.5 bg-gray-100 text-gray-600 rounded-lg font-bold hover:bg-gray-200"
                >
                  취소
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setIsCreating(true)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-indigo-600 font-bold bg-indigo-50 hover:bg-indigo-100 mt-2"
            >
              <Plus size={18} />
              <span>새 대화 시작</span>
            </button>
          )}
        </nav>
      </div>

      <div className="flex-1 px-6 overflow-y-auto space-y-8">
        <div className="pb-4">
          <button
            onClick={() => setIsCategoriesExpanded(v => !v)}
            className="w-full flex items-center justify-between text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 px-3 hover:text-gray-600 transition-colors"
          >
            <span>Categories</span>
            <ChevronDown size={14} className={`transition-transform duration-200 ${isCategoriesExpanded ? 'rotate-180' : ''}`} />
          </button>
          {isCategoriesExpanded && (
            <div className="space-y-1">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => onCategoryClick(cat.id)}
                  className={`w-full text-left text-sm py-2 px-3 rounded-lg transition-colors flex items-center gap-2 ${
                    selectedCategoryId === cat.id
                      ? 'text-indigo-600 font-bold bg-indigo-50'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Folder size={14} className={selectedCategoryId === cat.id ? 'text-indigo-500' : 'text-gray-400'} />
                  <span className="truncate">{cat.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 px-3">Recent Chats</h3>
          <div className="space-y-1">
            {sessions.map(session => (
              <div
                key={session.id}
                className={`group flex items-center gap-1 rounded-lg transition-colors ${
                  currentSessionId === session.id ? 'bg-indigo-50' : 'hover:bg-gray-50'
                }`}
              >
                <button
                  onClick={() => onSessionClick(session.id)}
                  className={`flex-1 text-left text-sm py-2 pl-3 flex items-center gap-2 min-w-0 ${
                    currentSessionId === session.id ? 'text-indigo-600 font-bold' : 'text-gray-600'
                  }`}
                >
                  <MessageSquare size={14} className={currentSessionId === session.id ? 'text-indigo-500' : 'text-gray-400'} />
                  <p className="truncate">{session.title}</p>
                </button>
                <button
                  onClick={() => onSessionDelete(session.id)}
                  className="pr-2 opacity-0 group-hover:opacity-100 transition-opacity text-gray-300 hover:text-red-400"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
            {sessions.length === 0 && (
              <p className="text-[10px] text-gray-400 px-3 italic">대화 내역이 없습니다.</p>
            )}
          </div>
        </div>
      </div>

      <div className="p-6 border-t border-gray-100">
        <div className="flex items-center gap-3 p-2 bg-gray-50 rounded-xl">
          <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600">
            <User size={16} />
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-xs font-bold truncate text-indigo-900">{userName}</p>
            <p className="text-[10px] text-gray-500">{userStudentId}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
