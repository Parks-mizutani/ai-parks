'use client';

import { useState } from 'react';
import LocationMap from '@/components/LocationMap';
import ChatLog from '@/components/ChatLog';
import ControlPanel from '@/components/ControlPanel';
import AgentPanel from '@/components/AgentPanel';
import CreateAgentModal from '@/components/CreateAgentModal';
import { useLifeSimulation } from '@/lib/useLifeSimulation';

export default function Home() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // 生活シミュレーションを起動
  useLifeSimulation();

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* コントロールパネル */}
      <ControlPanel />

      {/* メインコンテンツ */}
      <div className="flex-1 flex overflow-hidden">
        {/* 左サイドバー: エージェント一覧 */}
        <div className="w-72 border-r bg-white flex flex-col">
          <div className="flex-1 overflow-auto">
            <AgentPanel />
          </div>
          <div className="p-4 border-t">
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg font-medium hover:from-blue-600 hover:to-purple-600 transition-all shadow-md hover:shadow-lg"
            >
              + 新しいエージェント
            </button>
          </div>
        </div>

        {/* 中央: ロケーションマップ */}
        <div className="flex-1 relative">
          <LocationMap />
        </div>

        {/* 右サイドバー: チャットログ */}
        <div className="w-80 border-l">
          <ChatLog />
        </div>
      </div>

      {/* エージェント作成モーダル */}
      <CreateAgentModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </div>
  );
}
