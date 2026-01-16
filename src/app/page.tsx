'use client';

import { useState } from 'react';
import LocationMap from '@/components/LocationMap';
import ChatLog from '@/components/ChatLog';
import ControlPanel from '@/components/ControlPanel';
import AgentPanel from '@/components/AgentPanel';
import CreateAgentModal from '@/components/CreateAgentModal';
import { useLifeSimulation } from '@/lib/useLifeSimulation';
import '@/styles/retro.css';

export default function Home() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // 生活シミュレーションを起動
  useLifeSimulation();

  return (
    <div className="retro-ui h-screen flex flex-col" style={{ backgroundColor: '#c8c8c8' }}>
      {/* コントロールパネル */}
      <ControlPanel />

      {/* メインコンテンツ */}
      <div className="flex-1 flex overflow-hidden m-1 gap-1">
        {/* 左サイドバー: エージェント一覧 */}
        <div className="w-72 flex flex-col retro-box p-0 overflow-hidden">
          <div className="flex-1 overflow-auto">
            <AgentPanel />
          </div>
          <div className="p-2 border-t-2 border-black">
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="retro-button w-full py-2 font-bold"
            >
              + あたらしい エージェント
            </button>
          </div>
        </div>

        {/* 中央: ロケーションマップ */}
        <div className="flex-1 relative retro-box p-0 overflow-hidden">
          <LocationMap />
        </div>

        {/* 右サイドバー: チャットログ */}
        <div className="w-80 retro-box p-0 overflow-hidden">
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
