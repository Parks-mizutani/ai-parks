'use client';

import { useEffect, useRef } from 'react';
import { useStore } from '@/stores/useStore';

export default function ChatLog() {
  const { chatLog, agents, clearChatLog } = useStore();
  const scrollRef = useRef<HTMLDivElement>(null);

  // 新しいメッセージが来たら自動スクロール
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatLog]);

  const getAgentColor = (agentId: string) => {
    const agent = agents.find((a) => a.id === agentId);
    return agent?.color || '#888';
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('ja-JP', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* ヘッダー */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50">
        <h3 className="font-bold text-gray-800">ログ</h3>
        <button
          onClick={clearChatLog}
          className="text-sm text-gray-500 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-100"
        >
          クリア
        </button>
      </div>

      {/* メッセージリスト */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        {chatLog.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            <p className="text-4xl mb-2">💬</p>
            <p>まだログがありません</p>
            <p className="text-sm">シミュレーションを開始すると</p>
            <p className="text-sm">ここに会話が表示されます</p>
          </div>
        ) : (
          chatLog.map((message) => (
            <div key={message.id} className="animate-fade-in">
              {message.type === 'action' ? (
                // アクションログ
                <div className="flex items-center gap-2 text-sm text-gray-500 italic">
                  <span className="text-xs">{formatTime(message.timestamp)}</span>
                  <span
                    className="font-medium"
                    style={{ color: getAgentColor(message.agentId) }}
                  >
                    {message.agentName}
                  </span>
                  <span>が {message.content}</span>
                </div>
              ) : message.type === 'thought' ? (
                // 思考ログ
                <div className="flex items-start gap-2 text-sm">
                  <span className="text-xs text-gray-400 mt-1">
                    {formatTime(message.timestamp)}
                  </span>
                  <div className="flex-1 bg-gray-100 rounded-lg px-3 py-2 italic text-gray-600">
                    <span
                      className="font-medium"
                      style={{ color: getAgentColor(message.agentId) }}
                    >
                      {message.agentName}
                    </span>
                    <span className="text-gray-400 mx-1">💭</span>
                    <span>{message.content}</span>
                  </div>
                </div>
              ) : (
                // 発言ログ
                <div className="flex items-start gap-2">
                  <span className="text-xs text-gray-400 mt-2">
                    {formatTime(message.timestamp)}
                  </span>
                  <div className="flex-1">
                    <div
                      className="inline-block rounded-2xl px-4 py-2 max-w-[85%]"
                      style={{
                        backgroundColor: getAgentColor(message.agentId) + '20',
                        borderLeft: `3px solid ${getAgentColor(message.agentId)}`,
                      }}
                    >
                      <p
                        className="font-medium text-sm mb-1"
                        style={{ color: getAgentColor(message.agentId) }}
                      >
                        {message.agentName}
                      </p>
                      <p className="text-gray-800">{message.content}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
