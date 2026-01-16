'use client';

import { useStore } from '@/stores/useStore';
import type { Agent, ParkFeature } from '@/types';

// 各フィーチャーのアイコン
const featureIcons: Record<ParkFeature['type'], string> = {
  bench: '🪑',
  tree: '🌳',
  fountain: '⛲',
  cafe: '☕',
  lamp: '🏮',
  flower: '🌸',
};

interface AgentMarkerProps {
  agent: Agent;
  isSelected: boolean;
  onClick: () => void;
}

function AgentMarker({ agent, isSelected, onClick }: AgentMarkerProps) {
  const statusColors = {
    idle: 'bg-gray-100',
    walking: 'bg-blue-100',
    talking: 'bg-green-100',
    thinking: 'bg-yellow-100',
  };

  return (
    <div
      className={`absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-300 ${
        isSelected ? 'scale-125 z-20' : 'z-10'
      }`}
      style={{ left: agent.position.x, top: agent.position.y }}
      onClick={onClick}
    >
      {/* 吹き出し（話している時） */}
      {agent.status === 'talking' && agent.currentAction && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-white rounded-lg px-3 py-1 shadow-lg text-sm max-w-48 whitespace-nowrap overflow-hidden text-ellipsis">
          {agent.currentAction}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-white" />
        </div>
      )}

      {/* エージェントのアバター */}
      <div
        className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold shadow-lg border-4 ${statusColors[agent.status]} ${
          isSelected ? 'ring-4 ring-yellow-400' : ''
        }`}
        style={{ backgroundColor: agent.color, borderColor: agent.color }}
      >
        {agent.persona.name.charAt(0)}
      </div>

      {/* 名前タグ */}
      <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 bg-black/70 text-white text-xs px-2 py-0.5 rounded whitespace-nowrap">
        {agent.persona.name}
      </div>

      {/* ステータスインジケーター */}
      {agent.status !== 'idle' && (
        <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-white flex items-center justify-center text-xs">
          {agent.status === 'walking' && '🚶'}
          {agent.status === 'talking' && '💬'}
          {agent.status === 'thinking' && '💭'}
        </div>
      )}
    </div>
  );
}

function FeatureMarker({ feature }: { feature: ParkFeature }) {
  return (
    <div
      className="absolute transform -translate-x-1/2 -translate-y-1/2 text-3xl select-none"
      style={{ left: feature.position.x, top: feature.position.y }}
      title={feature.name || feature.type}
    >
      {featureIcons[feature.type]}
    </div>
  );
}

export default function ParkMap() {
  const { currentPark, agents, selectedAgentId, selectAgent } = useStore();

  if (!currentPark) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-100">
        <p className="text-gray-500">パークが選択されていません</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* パーク背景 */}
      <div
        className="absolute inset-0"
        style={{
          backgroundColor: currentPark.backgroundColor,
          backgroundImage: `
            radial-gradient(circle at 20% 80%, rgba(34, 139, 34, 0.3) 0%, transparent 25%),
            radial-gradient(circle at 80% 20%, rgba(34, 139, 34, 0.2) 0%, transparent 30%),
            radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.1) 0%, transparent 50%)
          `,
        }}
      >
        {/* グリッドパターン */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)',
            backgroundSize: '50px 50px',
          }}
        />
      </div>

      {/* パーク名 */}
      <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg px-4 py-2 shadow-lg z-30">
        <h2 className="font-bold text-lg">{currentPark.name}</h2>
        <p className="text-sm text-gray-600">{currentPark.description}</p>
      </div>

      {/* フィーチャー（ベンチ、木など） */}
      {currentPark.features.map((feature) => (
        <FeatureMarker key={feature.id} feature={feature} />
      ))}

      {/* エージェント */}
      {agents.map((agent) => (
        <AgentMarker
          key={agent.id}
          agent={agent}
          isSelected={selectedAgentId === agent.id}
          onClick={() => selectAgent(selectedAgentId === agent.id ? null : agent.id)}
        />
      ))}
    </div>
  );
}
