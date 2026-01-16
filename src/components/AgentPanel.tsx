'use client';

import { useStore } from '@/stores/useStore';

export default function AgentPanel() {
  const { agents, selectedAgentId, selectAgent, removeAgent } = useStore();
  const selectedAgent = agents.find((a) => a.id === selectedAgentId);

  if (!selectedAgent) {
    return (
      <div className="h-full bg-gray-50 p-4 flex flex-col">
        <h3 className="font-bold text-gray-800 mb-4">エージェント一覧</h3>
        <div className="flex-1 overflow-y-auto space-y-2">
          {agents.map((agent) => (
            <div
              key={agent.id}
              onClick={() => selectAgent(agent.id)}
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
                  <p className="text-sm text-gray-500">{agent.persona.age}歳</p>
                </div>
                <div className="text-xs text-gray-400">
                  {agent.status === 'idle' && '待機中'}
                  {agent.status === 'walking' && '移動中'}
                  {agent.status === 'talking' && '会話中'}
                  {agent.status === 'thinking' && '思考中'}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

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
            className="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold"
            style={{ backgroundColor: selectedAgent.color }}
          >
            {selectedAgent.persona.name.charAt(0)}
          </div>
          <div>
            <h2 className="text-xl font-bold">{selectedAgent.persona.name}</h2>
            <p className="text-gray-600">{selectedAgent.persona.age}歳</p>
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

        <div className="space-y-3">
          <div>
            <h4 className="text-sm font-medium text-gray-500">性格</h4>
            <p className="text-gray-800">{selectedAgent.persona.personality}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-500">背景</h4>
            <p className="text-gray-800">{selectedAgent.persona.background}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-500">話し方</h4>
            <p className="text-gray-800">{selectedAgent.persona.speakingStyle}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-500">目標・興味</h4>
            <ul className="list-disc list-inside text-gray-800">
              {selectedAgent.persona.goals.map((goal, i) => (
                <li key={i}>{goal}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* 現在のステータス */}
      <div className="bg-white rounded-lg p-4 mb-4 shadow-sm">
        <h3 className="font-medium text-gray-800 mb-2">現在の状態</h3>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <span className="text-gray-500">ステータス:</span>{' '}
            <span className="font-medium">
              {selectedAgent.status === 'idle' && '待機中'}
              {selectedAgent.status === 'walking' && '移動中 🚶'}
              {selectedAgent.status === 'talking' && '会話中 💬'}
              {selectedAgent.status === 'thinking' && '思考中 💭'}
            </span>
          </div>
          <div>
            <span className="text-gray-500">位置:</span>{' '}
            <span className="font-medium">
              ({Math.round(selectedAgent.position.x)}, {Math.round(selectedAgent.position.y)})
            </span>
          </div>
        </div>
        {selectedAgent.currentAction && (
          <p className="mt-2 text-gray-600 italic">"{selectedAgent.currentAction}"</p>
        )}
      </div>

      {/* アクションボタン */}
      {selectedAgent.createdBy === 'user' && (
        <button
          onClick={() => {
            if (confirm(`${selectedAgent.persona.name}を削除しますか？`)) {
              removeAgent(selectedAgent.id);
            }
          }}
          className="mt-auto bg-red-100 text-red-600 hover:bg-red-200 px-4 py-2 rounded-lg transition-colors"
        >
          このエージェントを削除
        </button>
      )}
    </div>
  );
}
