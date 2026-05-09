'use client';

import { useEffect, useState, useRef } from 'react';
import { Loader2, Send, ChevronRight, ChevronLeft, Bot, FileText, Trash2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { getDocumentView } from '@/api/documents';
import type { DocumentView } from '@/api/documents';
import type { SimpleMessage } from '@/types';

interface Props {
  documentId: number;
  messages: SimpleMessage[];
  isAsking: boolean;
  onSend: (content: string) => void;
  onClear: () => void;
}

export default function DocumentViewerPane({ documentId, messages, isAsking, onSend, onClear }: Props) {
  const [view, setView] = useState<DocumentView | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [chatOpen, setChatOpen] = useState(true);
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsLoading(true);
    setView(null);
    getDocumentView(documentId)
      .then(setView)
      .finally(() => setIsLoading(false));
  }, [documentId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isAsking]);

  const handleSend = () => {
    if (!input.trim() || isAsking) return;
    onSend(input.trim());
    setInput('');
  };

  return (
    <div className="flex h-full">
      {/* 문서 영역 */}
      <div className="flex-1 overflow-hidden bg-gray-50">
        {isLoading && (
          <div className="h-full flex items-center justify-center">
            <Loader2 size={36} className="animate-spin text-indigo-400" />
          </div>
        )}
        {!isLoading && view && (
          view.ext === '.pdf' && view.signed_url ? (
            <iframe
              src={view.signed_url}
              className="w-full h-full border-0"
              title={view.filename}
            />
          ) : (
            <div className="h-full overflow-y-auto p-10">
              {view.content ? (
                <pre className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap font-sans max-w-3xl mx-auto">
                  {view.content}
                </pre>
              ) : (
                <p className="text-center text-gray-400 mt-20 text-sm">
                  텍스트 내용을 불러올 수 없습니다.
                </p>
              )}
            </div>
          )
        )}
      </div>

      {/* 미니 채팅 패널 */}
      <div className={`flex flex-col border-l border-gray-200 bg-white shrink-0 transition-all duration-200 ${chatOpen ? 'w-96' : 'w-14'}`}>
        {/* 패널 헤더 */}
        <div className="flex items-center gap-3 px-3 py-4 border-b border-gray-100 shrink-0">
          <button
            onClick={() => setChatOpen(v => !v)}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-indigo-600 transition-colors shrink-0"
            title={chatOpen ? '채팅 접기' : '채팅 열기'}
          >
            {chatOpen ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
          {chatOpen && (
            <div className="flex items-center justify-between flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <Bot size={17} className="text-indigo-500 shrink-0" />
                <span className="font-bold text-sm text-gray-700">AI에게 물어보기</span>
              </div>
              {messages.length > 0 && (
                <button
                  onClick={onClear}
                  className="p-1.5 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-400 transition-colors shrink-0"
                  title="채팅 초기화"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          )}
        </div>

        {chatOpen && (
          <>
            {/* 메시지 목록 */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 && (
                <div className="text-center text-gray-400 text-xs mt-10 leading-relaxed">
                  이 문서에 대해<br />궁금한 점을 물어보세요.
                </div>
              )}
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[88%] px-3 py-2.5 rounded-2xl text-xs leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-indigo-600 text-white rounded-tr-none'
                      : 'bg-gray-100 text-gray-800 rounded-tl-none'
                  }`}>
                    {msg.sender === 'ai' ? (
                      <>
                        <div className="prose prose-xs max-w-none prose-p:my-0.5 prose-ul:my-1 prose-li:my-0">
                          <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                            {msg.content}
                          </ReactMarkdown>
                        </div>
                        {msg.sources && msg.sources.length > 0 && (
                          <div className="mt-2 pt-2 border-t border-gray-200">
                            <p className="text-[10px] font-bold text-gray-400 mb-1">참고 자료</p>
                            <div className="flex flex-col gap-1">
                              {msg.sources.map((src, i) => (
                                <div key={i} className="flex items-center gap-1 text-[10px] text-indigo-500 font-bold">
                                  <FileText size={9} />
                                  <span>{src.filename}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    )}
                  </div>
                </div>
              ))}
              {isAsking && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 px-3 py-2.5 rounded-2xl rounded-tl-none">
                    <Loader2 size={14} className="animate-spin text-indigo-400" />
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* 입력창 */}
            <div className="p-3 border-t border-gray-100 shrink-0">
              <div className="flex items-end gap-2 bg-gray-50 border border-gray-200 rounded-2xl px-3 py-2 focus-within:border-indigo-300 transition-colors">
                <textarea
                  rows={1}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder="질문 입력..."
                  disabled={isAsking}
                  className="flex-1 bg-transparent text-xs resize-none focus:outline-none max-h-24 disabled:opacity-50"
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isAsking}
                  className="p-1.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:bg-gray-200 transition-all shrink-0"
                >
                  {isAsking
                    ? <Loader2 size={13} className="animate-spin" />
                    : <Send size={13} />}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
