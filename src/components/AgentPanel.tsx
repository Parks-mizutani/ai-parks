'use client';

import { useStore } from '@/stores/useStore';
import type { Agent } from '@/types';

// ステータスの日本語表示（レトロ風）
const statusLabels: Record<string, string> = {
  idle: 'たいき',
  walking: 'いどう',
  talking: 'かいわ',
  thinking: 'しこう',
  working: 'しごと',
  eating: 'しょくじ',
  shopping: 'かいもの',
  sleeping: 'すいみん',
  commuting: 'つうきん',
};

const statusIcons: Record<string, string> = {
  idle: '○',
  walking: '→',
  talking: '♪',
  thinking: '?',
  working: '■',
  eating: '◇',
  shopping: '★',
  sleeping: '～',
  commuting: '⇒',
};

export default function AgentPanel() {
  const { agents, selectedAgentId, selectAgent, removeAgent, locations, currentLocation } = useStore();
  const selectedAgent = agents.find((a) => a.id === selectedAgentId);

  // 現在のロケーションにいるエージェント
  const agentsHere = agents.filter((a) => a.currentLocationId === currentLocation.id);
  const agentsElsewhere = agents.filter((a) => a.currentLocationId !== currentLocation.id);

  if (!selectedAgent) {
    return (
      <div className="retro-ui h-full p-2 flex flex-col" style={{ backgroundColor: '#f8f8f8' }}>
        <div className="retro-title mb-2">エージェント</div>

        {/* この場所にいるエージェント */}
        {agentsHere.length > 0 && (
          <div className="mb-3">
            <p className="text-xs mb-1">▸ {currentLocation.name}</p>
            <div className="space-y-1">
              {agentsHere.map((agent) => (
                <AgentCard key={agent.id} agent={agent} onClick={() => selectAgent(agent.id)} />
              ))}
            </div>
          </div>
        )}

        {/* 他の場所にいるエージェント */}
        {agentsElsewhere.length > 0 && (
          <div>
            <p className="text-xs mb-1 text-gray-500">▸ ほかのばしょ</p>
            <div className="space-y-1">
              {agentsElsewhere.map((agent) => {
                const loc = locations.find((l) => l.id === agent.currentLocationId);
                return (
                  <AgentCard
                    key={agent.id}
                    agent={agent}
                    onClick={() => selectAgent(agent.id)}
                    locationName={loc?.name}
                  />
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  const homeLocation = locations.find((l) => l.id === selectedAgent.life.homeLocationId);
  const workLocation = selectedAgent.life.workLocationId
    ? locations.find((l) => l.id === selectedAgent.life.workLocationId)
    : null;
  const currentLoc = locations.find((l) => l.id === selectedAgent.currentLocationId);

  // エネルギーバーの色
  const energyColor = selectedAgent.energy > 50 ? '#30c030' : selectedAgent.energy > 25 ? '#f8d830' : '#f83030';
  const moodColor = selectedAgent.mood > 50 ? '#30c030' : selectedAgent.mood > 25 ? '#f8d830' : '#f83030';

  return (
    <div className="retro-ui h-full p-2 flex flex-col overflow-y-auto" style={{ backgroundColor: '#f8f8f8' }}>
      {/* 戻るボタン */}
      <button
        onClick={() => selectAgent(null)}
        className="retro-button text-xs py-1 px-2 mb-2 self-start"
      >
        ◀ もどる
      </button>

      {/* プロフィールヘッダー */}
      <div className="retro-box-simple mb-2">
        <div className="flex items-center gap-3 mb-3">
          <div
            className="w-12 h-12 flex items-center justify-center text-white text-xl font-bold"
            style={{
              backgroundColor: selectedAgent.color,
              border: '3px solid #202020',
            }}
          >
            {selectedAgent.persona.name.charAt(0)}
          </div>
          <div>
            <div className="font-bold text-lg">{selectedAgent.persona.name}</div>
            <div className="text-sm text-gray-600">
              {selectedAgent.persona.age}さい / {selectedAgent.persona.occupation}
            </div>
          </div>
        </div>

        {/* エネルギーと気分（HP/EXPバー風） */}
        <div className="space-y-2 mb-3">
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span>HP</span>
              <span>{selectedAgent.energy}/100</span>
            </div>
            <div className="retro-progress">
              <div
                className="retro-progress-fill"
                style={{ width: `${selectedAgent.energy}%`, backgroundColor: energyColor }}
              />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span>きぶん</span>
              <span>{selectedAgent.mood}/100</span>
            </div>
            <div className="retro-progress">
              <div
                className="retro-progress-fill"
                style={{ width: `${selectedAgent.mood}%`, backgroundColor: moodColor }}
              />
            </div>
          </div>
        </div>

        <div className="space-y-2 text-xs">
          <div className="border-t border-dashed border-gray-400 pt-2">
            <span className="text-gray-500">せいかく:</span>
            <p className="mt-1">{selectedAgent.persona.personality}</p>
          </div>
        </div>
      </div>

      {/* 生活情報 */}
      <div className="retro-box-simple mb-2">
        <div className="text-xs font-bold mb-2">▸ せいかつ</div>
        <div className="space-y-1 text-xs">
          <div className="flex justify-between">
            <span className="text-gray-500">じたく</span>
            <span>{homeLocation?.name || 'ふめい'}</span>
          </div>
          {workLocation && (
            <>
              <div className="flex justify-between">
                <span className="text-gray-500">しょくば</span>
                <span>{workLocation.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">きんむ</span>
                <span>{selectedAgent.life.workStartHour}:00-{selectedAgent.life.workEndHour}:00</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* 現在の状態 */}
      <div className="retro-box-simple mb-2">
        <div className="text-xs font-bold mb-2">▸ いま</div>
        <div className="space-y-1 text-xs">
          <div className="flex justify-between">
            <span className="text-gray-500">ばしょ</span>
            <span>{currentLoc?.name || 'ふめい'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">じょうたい</span>
            <span>
              {statusIcons[selectedAgent.status]} {statusLabels[selectedAgent.status]}
            </span>
          </div>
        </div>
        {selectedAgent.currentAction && (
          <p className="mt-2 text-gray-600 text-xs border-t border-dashed border-gray-300 pt-2">
            「{selectedAgent.currentAction}」
          </p>
        )}
      </div>

      {/* 記憶（メモリー）表示 */}
      {selectedAgent.memories.length > 0 && (
        <div className="retro-box-simple mb-2">
          <div className="text-xs font-bold mb-2">▸ きおく ({selectedAgent.memories.length})</div>
          <div className="space-y-1 text-xs max-h-24 overflow-y-auto">
            {selectedAgent.memories.slice(-3).map((memory) => (
              <div key={memory.id} className="border-b border-dashed border-gray-300 pb-1">
                <span className="text-gray-400">Day{memory.dayNumber}:</span> {memory.content}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 削除ボタン */}
      {selectedAgent.createdBy === 'user' && (
        <button
          onClick={() => {
            if (confirm(`${selectedAgent.persona.name}を さくじょしますか？`)) {
              removeAgent(selectedAgent.id);
            }
          }}
          className="retro-button mt-auto text-xs"
          style={{ color: '#f83030' }}
        >
          さくじょする
        </button>
      )}
    </div>
  );
}

// エージェントカードコンポーネント（レトロ風）
function AgentCard({
  agent,
  onClick,
  locationName,
}: {
  agent: Agent;
  onClick: () => void;
  locationName?: string;
}) {
  return (
    <div
      onClick={onClick}
      className="retro-menu-item p-2 cursor-pointer border-2 border-black bg-white"
    >
      <div className="flex items-center gap-2">
        <div
          className="w-8 h-8 flex items-center justify-center text-white font-bold text-sm"
          style={{
            backgroundColor: agent.color,
            border: '2px solid #202020',
          }}
        >
          {agent.persona.name.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm truncate">{agent.persona.name}</p>
          <p className="text-xs text-gray-500 truncate">
            {agent.persona.occupation}
            {locationName && ` ・${locationName}`}
          </p>
        </div>
        <div className="text-right text-xs">
          <div>{statusIcons[agent.status]}</div>
          <div className="text-gray-400">{statusLabels[agent.status]}</div>
        </div>
      </div>
    </div>
  );
}
