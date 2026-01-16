'use client';

import { useStore } from '@/stores/useStore';

export default function ControlPanel() {
  const { simulation, toggleSimulation, setSimulationSpeed, agents } = useStore();

  return (
    <div className="bg-white border-b px-4 py-3 flex items-center justify-between">
      {/* 左側: タイトルと統計 */}
      <div className="flex items-center gap-6">
        <h1 className="text-xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
          🏞️ AI Parks
        </h1>
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <span>
            👥 エージェント: <strong>{agents.length}</strong>
          </span>
          <span className={simulation.isRunning ? 'text-green-600' : 'text-gray-400'}>
            {simulation.isRunning ? '● シミュレーション中' : '○ 停止中'}
          </span>
        </div>
      </div>

      {/* 右側: コントロール */}
      <div className="flex items-center gap-4">
        {/* スピード調整 */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">速度:</span>
          <select
            value={simulation.speed}
            onChange={(e) => setSimulationSpeed(Number(e.target.value))}
            className="border rounded px-2 py-1 text-sm"
          >
            <option value={0.5}>0.5x</option>
            <option value={1}>1x</option>
            <option value={2}>2x</option>
            <option value={3}>3x</option>
          </select>
        </div>

        {/* 再生/停止ボタン */}
        <button
          onClick={toggleSimulation}
          className={`px-6 py-2 rounded-full font-medium transition-all ${
            simulation.isRunning
              ? 'bg-red-500 hover:bg-red-600 text-white'
              : 'bg-green-500 hover:bg-green-600 text-white'
          }`}
        >
          {simulation.isRunning ? '⏹ 停止' : '▶ 開始'}
        </button>
      </div>
    </div>
  );
}
