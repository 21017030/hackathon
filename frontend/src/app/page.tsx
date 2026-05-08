'use client';

import { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import { 
  Plus, 
  MessageSquare, 
  FileText, 
  Folder, 
  Send, 
  Upload, 
  MoreVertical,
  User,
  CheckCircle2,
  Clock,
  Loader2,
  Search,
  ChevronRight,
  HardDrive,
  Clock3,
  ChevronDown
} from 'lucide-react';

// --- Types ---
interface Category {
  id: number;
  name: string;
}

interface Document {
  id: number;
  original_file_name: string;
  parsing_status: 'PENDING' | 'COMPLETED' | 'FAILED';
  category_id?: number;
  created_at: string;
}

interface ChatSession {
  id: number;
  title: string;
  created_at: string;
}

interface Message {
  id: number;
  sender_type: 'USER' | 'AI';
  content: string;
  created_at: string;
}

type ViewMode = 'chat' | 'explorer';

const API_BASE = 'http://localhost:8000';

export default function App() {
  // --- States ---
  const [viewMode, setViewMode] = useState<ViewMode>('explorer');
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [isCategoriesExpanded, setIsCategoriesExpanded] = useState(false);
  const [studentId] = useState('20230001'); // 실제로는 로그인 연동 필요
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isAsking, setIsAsking] = useState(false);

  // --- API Calls ---
  const fetchData = useCallback(async () => {
    try {
      const [catRes, docRes, sessionRes] = await Promise.all([
        axios.get(`${API_BASE}/test/categories`),
        axios.get(`${API_BASE}/test/documents`),
        axios.get(`${API_BASE}/chat/sessions/${studentId}`)
      ]);
      setCategories(catRes.data.categories || []);
      setDocuments(docRes.data.documents || []);
      setSessions(sessionRes.data || []);
    } catch (err) {
      console.error("Data fetch failed", err);
    }
  }, [studentId]);

  useEffect(() => {
    fetchData();
    // 5초마다 문서 상태 확인 (폴링)
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const fetchMessages = async (sessionId: number) => {
    try {
      const res = await axios.get(`${API_BASE}/chat/messages/${sessionId}`);
      setMessages(res.data);
    } catch (err) {
      console.error("Failed to fetch messages", err);
    }
  };

  // --- Handlers ---
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    
    const file = acceptedFiles[0];
    setIsUploading(true);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('student_id', studentId);
    if (selectedCategoryId) formData.append('category_id', selectedCategoryId.toString());

    try {
      await axios.post(`${API_BASE}/upload`, formData);
      fetchData(); // 즉시 갱신
    } catch (error) {
      console.error("Upload failed", error);
      alert("업로드에 실패했습니다.");
    } finally {
      setIsUploading(false);
    }
  }, [studentId, selectedCategoryId, fetchData]);

  const { getRootProps, getInputProps } = useDropzone({ onDrop, multiple: false });

  const handleStartNewChat = async () => {
    const title = prompt("새 대화방의 제목을 입력하세요:", "새로운 학습 대화");
    if (!title) return;

    try {
      const res = await axios.post(`${API_BASE}/chat/session`, {
        student_id: studentId,
        title: title
      });
      setSessions([res.data, ...sessions]);
      handleSessionClick(res.data.id);
    } catch (err) {
      alert("대화방 생성에 실패했습니다.");
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim() || !currentSessionId || isAsking) return;
    
    const userContent = input;
    setInput('');
    setIsAsking(true);

    // 낙관적 업데이트 (UI에 먼저 표시)
    const tempUserMsg: Message = { 
      id: Date.now(), 
      sender_type: 'USER', 
      content: userContent, 
      created_at: new Date().toISOString() 
    };
    setMessages(prev => [...prev, tempUserMsg]);

    try {
      const res = await axios.post(`${API_BASE}/chat/ask`, {
        session_id: currentSessionId,
        content: userContent,
        document_ids: selectedCategoryId 
          ? documents.filter(d => d.category_id === selectedCategoryId).map(d => d.id)
          : null
      });
      setMessages(prev => [...prev, res.data]);
    } catch (error) {
      console.error("Ask failed", error);
      alert("AI 응답을 가져오는데 실패했습니다.");
    } finally {
      setIsAsking(false);
    }
  };

  const handleSessionClick = (id: number) => {
    setCurrentSessionId(id);
    setViewMode('chat');
    fetchMessages(id);
  };

  const currentCategoryName = categories.find(c => c.id === selectedCategoryId)?.name || '모든 자료';
  const currentSessionTitle = sessions.find(s => s.id === currentSessionId)?.title || 'AI 학습 챗';

  return (
    <div className="flex h-screen bg-[#F8F9FB] text-gray-800 font-sans">
      {/* --- Sidebar --- */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col shadow-sm">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-8 cursor-pointer" onClick={() => (setViewMode('explorer'), setSelectedCategoryId(null))}>
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">V</div>
            <span className="text-xl font-bold tracking-tight text-indigo-900">VibeLRS</span>
          </div>

          <nav className="space-y-1">
            <button 
              onClick={() => (setViewMode('explorer'), setSelectedCategoryId(null), setCurrentSessionId(null))}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${viewMode === 'explorer' && selectedCategoryId === null ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              <HardDrive size={18} />
              <span>내 보관함</span>
            </button>
            <button 
              onClick={handleStartNewChat}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-indigo-600 font-bold bg-indigo-50 hover:bg-indigo-100 mt-2`}
            >
              <Plus size={18} />
              <span>새 대화 시작</span>
            </button>
          </nav>
        </div>

        <div className="flex-1 px-6 overflow-y-auto space-y-8">
          {/* Recent Chats Section */}
          <div>
            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 px-3">Recent Chats</h3>
            <div className="space-y-1">
              {sessions.map(session => (
                <button 
                  key={session.id}
                  onClick={() => handleSessionClick(session.id)}
                  className={`w-full text-left text-sm py-2 px-3 rounded-lg transition-colors flex items-center gap-2 group ${currentSessionId === session.id ? 'text-indigo-600 font-bold bg-indigo-50' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                  <MessageSquare size={14} className={currentSessionId === session.id ? 'text-indigo-500' : 'text-gray-400'} />
                  <div className="flex-1 overflow-hidden">
                    <p className="truncate">{session.title}</p>
                  </div>
                </button>
              ))}
              {sessions.length === 0 && <p className="text-[10px] text-gray-400 px-3 italic">대화 내역이 없습니다.</p>}
            </div>
          </div>

          {/* Categories Section */}
          <div className="pb-4">
            <button 
              onClick={() => setIsCategoriesExpanded(!isCategoriesExpanded)}
              className="w-full flex items-center justify-between text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 px-3 hover:text-gray-600 transition-colors"
            >
              <span>Categories</span>
              <ChevronDown size={14} className={`transition-transform duration-200 ${isCategoriesExpanded ? 'rotate-180' : ''}`} />
            </button>
            
            {isCategoriesExpanded && (
              <div className="space-y-1 animate-in slide-in-from-top-2 duration-200">
                {categories.map(cat => (
                  <button 
                    key={cat.id}
                    onClick={() => {
                      setSelectedCategoryId(cat.id);
                      setViewMode('explorer');
                      setCurrentSessionId(null);
                    }}
                    className={`w-full text-left text-sm py-2 px-3 rounded-lg transition-colors flex items-center gap-2 ${selectedCategoryId === cat.id ? 'text-indigo-600 font-bold bg-indigo-50' : 'text-gray-600 hover:bg-gray-50'}`}
                  >
                    <Folder size={14} className={selectedCategoryId === cat.id ? 'text-indigo-500' : 'text-gray-400'} />
                    <span className="truncate">{cat.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="p-6 border-t border-gray-100">
          <div className="flex items-center gap-3 p-2 bg-gray-50 rounded-xl">
            <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600">
              <User size={16} />
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-xs font-bold truncate text-indigo-900">홍길동 학생</p>
              <p className="text-[10px] text-gray-500">{studentId}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* --- Main Area --- */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8">
          <div className="flex items-center gap-3 text-sm">
            <span className="text-gray-400">{viewMode === 'explorer' ? '내 보관함' : 'AI 학습 챗'}</span>
            <ChevronRight size={14} className="text-gray-300" />
            <span className="font-bold text-gray-700">
              {viewMode === 'explorer' ? currentCategoryName : currentSessionTitle}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <button 
              {...getRootProps()}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 transition-all shadow-sm"
            >
              <input {...getInputProps()} />
              <Upload size={16} /> 자료 업로드
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8">
          {viewMode === 'explorer' ? (
            /* --- Explorer View --- */
            <div className="max-w-6xl mx-auto">
              {selectedCategoryId === null && (
                <div className="mb-10">
                  <div className="flex items-center gap-2 mb-4">
                    <Folder size={18} className="text-gray-400" />
                    <h3 className="text-sm font-bold text-gray-600">폴더</h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {categories.map(cat => (
                      <div 
                        key={cat.id} 
                        onClick={() => setSelectedCategoryId(cat.id)}
                        className={`p-4 bg-white border rounded-2xl cursor-pointer transition-all flex items-center gap-4 group ${selectedCategoryId === cat.id ? 'border-indigo-500 ring-2 ring-indigo-50 shadow-sm' : 'border-gray-200 hover:border-indigo-300 hover:shadow-md'}`}
                      >
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${selectedCategoryId === cat.id ? 'bg-indigo-100 text-indigo-600' : 'bg-indigo-50 text-indigo-500 group-hover:bg-indigo-100'}`}>
                          <Folder size={24} />
                        </div>
                        <div className="overflow-hidden">
                          <p className="font-bold text-sm truncate">{cat.name}</p>
                          <p className="text-[11px] text-gray-400">파일 {documents.filter(d => d.category_id === cat.id).length}개</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Files Table Style */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <FileText size={18} className="text-gray-400" />
                    <h3 className="text-sm font-bold text-gray-600">{selectedCategoryId ? `${currentCategoryName} 내 문서` : '모든 문서'}</h3>
                  </div>
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
                      {documents
                        .filter(doc => selectedCategoryId === null || doc.category_id === selectedCategoryId)
                        .map(doc => (
                        <tr key={doc.id} className="hover:bg-gray-50/30 transition-colors group">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 bg-red-50 text-red-500 rounded-lg flex items-center justify-center">
                                <FileText size={20} />
                              </div>
                              <div className="overflow-hidden">
                                <p className="font-bold text-gray-700 truncate">{doc.original_file_name}</p>
                                <p className="text-[10px] text-gray-400">{categories.find(c => c.id === doc.category_id)?.name || '분류 없음'}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {doc.parsing_status === 'COMPLETED' ? (
                              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 font-bold text-[10px]">
                                <CheckCircle2 size={12} /> 분석완료
                              </div>
                            ) : doc.parsing_status === 'FAILED' ? (
                                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-50 text-red-600 font-bold text-[10px]">
                                ❌ 분석실패
                              </div>
                            ) : (
                              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-600 font-bold text-[10px]">
                                <Clock3 size={12} className="animate-spin" style={{animationDuration: '3s'}} /> 분석중
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button 
                              onClick={() => setViewMode('chat')}
                              className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-bold hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                            >
                              질문하기
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            /* --- Chat View --- */
            <div className="max-w-4xl mx-auto h-full flex flex-col">
              <div className="flex-1 space-y-8 pb-32 pt-4">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center py-20 animate-in fade-in zoom-in duration-500">
                    <div className="w-24 h-24 bg-indigo-50 rounded-[2.5rem] flex items-center justify-center text-indigo-600 mb-8 shadow-inner">
                      <MessageSquare size={48} />
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900 tracking-tight">AI에게 질문하세요</h2>
                    <p className="text-gray-500 mt-3 max-w-sm text-lg text-center">자료 내용을 기반으로<br/>정확한 답변을 드립니다.</p>
                  </div>
                ) : (
                  messages.map(msg => (
                    <div key={msg.id} className={`flex ${msg.sender_type === 'USER' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}>
                      <div className={`max-w-[85%] p-6 rounded-[2rem] shadow-sm leading-relaxed ${
                        msg.sender_type === 'USER' 
                          ? 'bg-indigo-600 text-white rounded-tr-none' 
                          : 'bg-white border border-gray-100 text-gray-800 rounded-tl-none'
                      }`}>
                        <p className="text-[15px] whitespace-pre-wrap">{msg.content}</p>
                      </div>
                    </div>
                  ))
                )}
                {isAsking && (
                   <div className="flex justify-start animate-pulse">
                     <div className="bg-gray-100 p-6 rounded-[2rem] rounded-tl-none border border-gray-100">
                       <Loader2 size={24} className="animate-spin text-indigo-400" />
                     </div>
                   </div>
                )}
              </div>

              {/* Chat Input Area */}
              <div className="fixed bottom-8 left-64 right-0 flex justify-center px-8 pointer-events-none">
                <div className="w-full max-w-4xl pointer-events-auto">
                  <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-[2rem] blur opacity-15 group-hover:opacity-25 transition duration-1000 group-focus-within:opacity-30"></div>
                    <div className="relative bg-white border border-gray-200 rounded-[2rem] shadow-2xl flex items-end p-3 gap-2">
                      <textarea 
                        rows={1}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSendMessage())}
                        placeholder={currentSessionId ? "메시지를 입력하세요..." : "먼저 대화방을 선택하거나 새로 만드세요."}
                        disabled={!currentSessionId || isAsking}
                        className="flex-1 p-4 bg-transparent border-none focus:ring-0 text-base resize-none max-h-48 disabled:opacity-50"
                      />
                      <button 
                        onClick={handleSendMessage}
                        disabled={!input.trim() || !currentSessionId || isAsking}
                        className="p-4 bg-indigo-600 text-white rounded-[1.5rem] hover:bg-indigo-700 disabled:bg-gray-200 transition-all shadow-lg hover:shadow-indigo-200"
                      >
                        {isAsking ? <Loader2 size={22} className="animate-spin" /> : <Send size={22} />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Upload Modal Overlay */}
      {isUploading && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-md z-50 flex items-center justify-center animate-in fade-in duration-300">
          <div className="bg-white p-12 rounded-[3rem] shadow-2xl text-center max-w-md mx-auto">
            <div className="relative w-32 h-32 mx-auto mb-8">
              <div className="absolute inset-0 border-[6px] border-indigo-50 rounded-full"></div>
              <div className="absolute inset-0 border-[6px] border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center text-indigo-600">
                <Upload size={48} />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">자료 분석 중...</h2>
            <p className="text-gray-500">지식을 정리하고 있습니다.</p>
          </div>
        </div>
      )}
    </div>
  );
}
