'use client';

import { useEffect, useRef, useState } from 'react';
import { useStore } from '@/stores/useStore';

export default function ChatLog() {
  const { chatLog, agents, clearChatLog, simulation, currentLocation } = useStore();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [displayedText, setDisplayedText] = useState<string>('');
  const [currentMsgIndex, setCurrentMsgIndex] = useState<number>(-1);

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

  // ゲーム内時刻を表示
  const { gameTime } = simulation;
  const gameTimeStr = `${gameTime.hour.toString().padStart(2, '0')}:${gameTime.minute.toString().padStart(2, '0')}`;

  // 現在のロケーションのログのみフィルター
  const filteredLog = chatLog.filter(
    (msg) => !msg.locationId || msg.locationId === currentLocation.id
  );

  // 最新のメッセージ（ダイアログ表示用）
  const latestMessage = filteredLog.length > 0 ? filteredLog[filteredLog.length - 1] : null;

  return (
    <div className="retro-ui flex flex-col h-full" style={{ backgroundColor: '#f8f8f8' }}>
      {/* ヘッダー（レトロスタイル） */}
      <div className="retro-box-simple m-2 mb-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="retro-cursor" />
            <span className="font-bold">ログ</span>
            <span className="text-xs text-gray-600">- {currentLocation.name}</span>
          </div>
          <button
            onClick={clearChatLog}
            className="retro-button text-xs py-1 px-2"
          >
            クリア
          </button>
        </div>
      </div>

      {/* メッセージリスト */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-2 space-y-1">
        {filteredLog.length === 0 ? (
          <div className="retro-box m-2 text-center py-8">
            <p className="text-2xl mb-2">...</p>
            <p>まだ ログが ありません</p>
            <p className="text-sm mt-2">シミュレーションを かいしすると</p>
            <p className="text-sm">ここに かいわが ひょうじされます</p>
          </div>
        ) : (
          filteredLog.map((message, index) => (
            <div key={message.id} className="retro-message px-2">
              {message.type === 'action' ? (
                // アクションログ
                <div className="flex items-start gap-2 text-sm">
                  <span className="text-xs text-gray-500 w-12">{gameTimeStr}</span>
                  <span className="text-gray-400">▸</span>
                  <div className="flex-1">
                    <span
                      className="font-bold"
                      style={{ color: getAgentColor(message.agentId) }}
                    >
                      {message.agentName}
                    </span>
                    <span className="text-gray-600"> は {message.content}</span>
                  </div>
                </div>
              ) : message.type === 'thought' ? (
                // 思考ログ
                <div className="flex items-start gap-2 text-sm">
                  <span className="text-xs text-gray-500 w-12">{gameTimeStr}</span>
                  <span className="text-gray-400">♦</span>
                  <div className="flex-1 text-gray-500 italic">
                    <span
                      className="font-bold"
                      style={{ color: getAgentColor(message.agentId) }}
                    >
                      {message.agentName}
                    </span>
                    <span>「{message.content}」</span>
                  </div>
                </div>
              ) : (
                // 発言ログ
                <div className="flex items-start gap-2 text-sm">
                  <span className="text-xs text-gray-500 w-12">{gameTimeStr}</span>
                  <span style={{ color: getAgentColor(message.agentId) }}>◆</span>
                  <div className="flex-1">
                    <span
                      className="font-bold retro-message-name"
                      style={{ color: getAgentColor(message.agentId) }}
                    >
                      {message.agentName}
                    </span>
                    <span className="text-gray-700">「{message.content}」</span>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* 最新メッセージのダイアログ表示（ポケモン風） */}
      {latestMessage && latestMessage.type === 'speech' && (
        <div className="retro-box m-2 mt-0">
          <div className="flex items-start gap-3">
            {/* キャラアイコン */}
            <div
              className="w-10 h-10 rounded flex items-center justify-center text-white font-bold shrink-0"
              style={{
                backgroundColor: getAgentColor(latestMessage.agentId),
                border: '2px solid #202020',
              }}
            >
              {latestMessage.agentName.charAt(0)}
            </div>
            {/* メッセージ */}
            <div className="flex-1">
              <div
                className="font-bold text-sm mb-1"
                style={{ color: getAgentColor(latestMessage.agentId) }}
              >
                {latestMessage.agentName}
              </div>
              <div className="text-sm leading-relaxed">
                「{latestMessage.content}」
                <span className="retro-blink ml-1">▼</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
