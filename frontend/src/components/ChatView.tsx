'use client';

import { useState } from 'react';
import { MessageSquare, Send, Loader2, FileText } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import type { Message } from '@/types';

interface Props {
  messages: Message[];
  currentSessionId: number | null;
  isAsking: boolean;
  onSend: (content: string) => void;
}

/**
 * 채팅 화면 컴포넌트
 * AI와의 대화 내용을 보여주고 질문을 입력받습니다.
 */
export default function ChatView({ messages, currentSessionId, isAsking, onSend }: Props) {
  const [input, setInput] = useState('');

  // 메시지 전송 핸들러
  const handleSend = () => {
    if (!input.trim() || !currentSessionId || isAsking) return;
    onSend(input.trim());
    setInput('');
  };

  return (
    <div className="max-w-4xl mx-auto h-full flex flex-col">
      {/* 메시지 목록 영역 */}
      <div className="flex-1 space-y-8 pb-32 pt-4">
        {messages.length === 0 ? (
          /* 메시지가 없을 때 표시되는 빈 화면 */
          <div className="flex flex-col items-center justify-center h-full text-center py-20">
            <div className="w-24 h-24 bg-indigo-50 rounded-[2.5rem] flex items-center justify-center text-indigo-600 mb-8 shadow-inner">
              <MessageSquare size={48} />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 tracking-tight">AI에게 질문하세요</h2>
            <p className="text-gray-500 mt-3 max-w-sm text-lg text-center">
              자료 내용을 기반으로<br />정확한 답변을 드립니다.
            </p>
          </div>
        ) : (
          /* 실제 대화 메시지들 */
          messages.map(msg => (
            <div
              key={msg.id}
              className={`flex ${msg.sender_type === 'USER' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[85%] p-6 rounded-[2rem] shadow-sm leading-relaxed ${
                msg.sender_type === 'USER'
                  ? 'bg-indigo-600 text-white rounded-tr-none' // 사용자 메시지 스타일
                  : 'bg-white border border-gray-100 text-gray-800 rounded-tl-none' // AI 메시지 스타일
              }`}>
                {msg.sender_type === 'USER' ? (
                  <p className="text-[15px] whitespace-pre-wrap">{msg.content}</p>
                ) : (
                  <>
                    {/* AI 답변은 마크다운(Markdown) 형식을 지원합니다. */}
                    <div className="text-[15px] prose prose-sm max-w-none prose-headings:font-bold prose-headings:text-gray-900 prose-strong:font-semibold prose-ul:my-2 prose-li:my-0.5 prose-p:my-1">
                      <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                    {/* 답변의 근거가 된 참고 자료(출처) 표시 */}
                    {msg.sources && msg.sources.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <p className="text-[11px] font-bold text-gray-400 mb-2">참고 자료</p>
                        <div className="flex flex-wrap gap-1.5">
                          {msg.sources.map((src, i) => (
                            <div key={i} className="flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[11px] font-bold">
                              <FileText size={10} />
                              <span>{src.category} › {src.filename}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          ))
        )}
        {/* AI가 답변을 생성 중일 때 표시되는 로딩 아이콘 */}
        {isAsking && (
          <div className="flex justify-start">
            <div className="bg-gray-100 p-6 rounded-[2rem] rounded-tl-none border border-gray-100">
              <Loader2 size={24} className="animate-spin text-indigo-400" />
            </div>
          </div>
        )}
      </div>

      {/* 하단 질문 입력창 영역 (화면 하단에 고정) */}
      <div className="fixed bottom-8 left-64 right-0 flex justify-center px-8 pointer-events-none">
        <div className="w-full max-w-4xl pointer-events-auto">
          <div className="relative group">
            {/* 입력창 배경 글로우 효과 */}
            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-[2rem] blur opacity-15 group-hover:opacity-25 transition duration-1000 group-focus-within:opacity-30" />
            <div className="relative bg-white border border-gray-200 rounded-[2rem] shadow-2xl flex items-end p-3 gap-2">
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
                placeholder={currentSessionId ? '메시지를 입력하세요...' : '먼저 대화방을 선택하거나 새로 만드세요.'}
                disabled={!currentSessionId || isAsking}
                className="flex-1 p-4 bg-transparent border-none focus:ring-0 text-base resize-none max-h-48 disabled:opacity-50"
              />
              <button
                onClick={handleSend}
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
  );
}
