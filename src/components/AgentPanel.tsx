'use client';

import { useStore } from '@/stores/useStore';
import type { Agent } from '@/types';

// ステータスの日本語表示
const statusLabels: Record<string, string> = {
  idle: '待機中',
  walking: '移動中',
  talking: '会話中',
  thinking: '考え中',
  working: '仕事中',
  eating: '食事中',
  shopping: '買い物中',
  sleeping: '睡眠中',
  commuting: '通勤中',
};

const statusEmojis: Record<string, string> = {
  idle: '😊',
  walking: '🚶',
  talking: '💬',
  thinking: '💭',
  working: '💼',
  eating: '🍽️',
  shopping: '🛍️',
  sleeping: '😴',
  commuting: '🚃',
};

export default function AgentPanel() {
  const { agents, selectedAgentId, selectAgent, removeAgent, locations, currentLocation } = useStore();
  const selectedAgent = agents.find((a) => a.id === selectedAgentId);

  // 現在のロケーションにいるエージェント
  const agentsHere = agents.filter((a) => a.currentLocationId === currentLocation.id);
  const agentsElsewhere = agents.filter((a) => a.currentLocationId !== currentLocation.id);

  if (!selectedAgent) {
    return (
      <div className="h-full bg-gray-50 p-4 flex flex-col">
        <h3 className="font-bold text-gray-800 mb-4">エージェント一覧</h3>

        {/* この場所にいるエージェント */}
        {agentsHere.length > 0 && (
          <div className="mb-4">
            <p className="text-xs text-gray-500 mb-2">📍 {currentLocation.name}にいる</p>
            <div className="space-y-2">
              {agentsHere.map((agent) => (
                <AgentCard key={agent.id} agent={agent} onClick={() => selectAgent(agent.id)} />
              ))}
            </div>
          </div>
        )}

        {/* 他の場所にいるエージェント */}
        {agentsElsewhere.length > 0 && (
          <div>
            <p className="text-xs text-gray-500 mb-2">🗺️ 他の場所にいる</p>
            <div className="space-y-2">
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

  return (
    <div className="h-full bg-gray-50 p-4 flex flex-col overflow-y-auto">
      {/* 戻るボタン */}
      <button
        onClick={() => selectAgent(null)}
        className="text-sm text-gray-500 hover:text-gray-700 mb-4 text-left"
      >
        ← 一覧に戻る
      </button>

      {/* プロフィールヘッダー */}
      <div className="bg-white rounded-lg p-4 mb-4 shadow-sm">
        <div className="flex items-center gap-4 mb-4">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-md"
            style={{ backgroundColor: selectedAgent.color }}
          >
            {selectedAgent.persona.name.charAt(0)}
          </div>
          <div>
            <h2 className="text-xl font-bold">{selectedAgent.persona.name}</h2>
            <p className="text-gray-600">{selectedAgent.persona.age}歳 / {selectedAgent.persona.occupation}</p>
            <span
              className={`inline-block px-2 py-0.5 rounded-full text-xs mt-1 ${
                selectedAgent.createdBy === 'user'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              {selectedAgent.createdBy === 'user' ? 'ユーザー作成' : 'システム'}
            </span>
          </div>
        </div>

        {/* エネルギーと気分 */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span>⚡ エネルギー</span>
              <span>{selectedAgent.energy}%</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full">
              <div
                className="h-full bg-yellow-400 rounded-full transition-all"
                style={{ width: `${selectedAgent.energy}%` }}
              />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span>😊 気分</span>
              <span>{selectedAgent.mood}%</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full">
              <div
                className="h-full bg-pink-400 rounded-full transition-all"
                style={{ width: `${selectedAgent.mood}%` }}
              />
            </div>
          </div>
        </div>

        <div className="space-y-3 text-sm">
          <div>
            <h4 className="font-medium text-gray-500">性格</h4>
            <p className="text-gray-800">{selectedAgent.persona.personality}</p>
          </div>
          <div>
            <h4 className="font-medium text-gray-500">背景</h4>
            <p className="text-gray-800">{selectedAgent.persona.background}</p>
          </div>
          <div>
            <h4 className="font-medium text-gray-500">話し方</h4>
            <p className="text-gray-800">{selectedAgent.persona.speakingStyle}</p>
          </div>
          <div>
            <h4 className="font-medium text-gray-500">目標</h4>
            <ul className="list-disc list-inside text-gray-800">
              {selectedAgent.persona.goals.map((goal, i) => (
                <li key={i}>{goal}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* 生活情報 */}
      <div className="bg-white rounded-lg p-4 mb-4 shadow-sm">
        <h3 className="font-medium text-gray-800 mb-3">🏠 生活</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">自宅</span>
            <span className="font-medium">{homeLocation?.name || '不明'}</span>
          </div>
          {workLocation && (
            <>
              <div className="flex justify-between">
                <span className="text-gray-500">職場</span>
                <span className="font-medium">{workLocation.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">勤務時間</span>
                <span className="font-medium">
                  {selectedAgent.life.workStartHour}:00 - {selectedAgent.life.workEndHour}:00
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* 現在の状態 */}
      <div className="bg-white rounded-lg p-4 mb-4 shadow-sm">
        <h3 className="font-medium text-gray-800 mb-3">📍 現在の状態</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">場所</span>
            <span className="font-medium">{currentLoc?.name || '不明'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">ステータス</span>
            <span className="font-medium">
              {statusEmojis[selectedAgent.status]} {statusLabels[selectedAgent.status]}
            </span>
          </div>
        </div>
        {selectedAgent.currentAction && (
          <p className="mt-2 text-gray-600 italic text-sm">"{selectedAgent.currentAction}"</p>
        )}
      </div>

      {/* 削除ボタン */}
      {selectedAgent.createdBy === 'user' && (
        <button
          onClick={() => {
            if (confirm(`${selectedAgent.persona.name}を削除しますか？`)) {
              removeAgent(selectedAgent.id);
            }
          }}
          className="mt-auto bg-red-100 text-red-600 hover:bg-red-200 px-4 py-2 rounded-lg transition-colors text-sm"
        >
          このエージェントを削除
        </button>
      )}
    </div>
  );
}

// エージェントカードコンポーネント
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
      className="bg-white rounded-lg p-3 cursor-pointer hover:shadow-md transition-shadow border border-gray-200"
    >
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
          style={{ backgroundColor: agent.color }}
        >
          {agent.persona.name.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{agent.persona.name}</p>
          <p className="text-xs text-gray-500">
            {agent.persona.occupation}
            {locationName && ` • ${locationName}`}
          </p>
        </div>
        <div className="text-right">
          <div className="text-sm">
            {statusEmojis[agent.status]}
          </div>
          <div className="text-xs text-gray-400">
            {statusLabels[agent.status]}
          </div>
        </div>
      </div>
    </div>
  );
}
