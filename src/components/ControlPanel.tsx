'use client';

import { useStore } from '@/stores/useStore';

// 時間帯に応じた背景色
const timeColors = {
  morning: 'from-orange-200 to-yellow-100',
  afternoon: 'from-blue-200 to-cyan-100',
  evening: 'from-orange-300 to-pink-200',
  night: 'from-indigo-400 to-purple-300',
};

// 時間帯のアイコン
const timeIcons = {
  morning: '🌅',
  afternoon: '☀️',
  evening: '🌆',
  night: '🌙',
};

export default function ControlPanel() {
  const {
    simulation,
    toggleSimulation,
    setSimulationSpeed,
    agents,
    aiMode,
    toggleAIMode,
    currentLocation,
    locations,
    setCurrentLocation,
  } = useStore();

  const { gameTime } = simulation;
  const timeStr = `${gameTime.hour.toString().padStart(2, '0')}:${gameTime.minute.toString().padStart(2, '0')}`;

  return (
    <div className="bg-white border-b px-4 py-3">
      <div className="flex items-center justify-between">
        {/* 左側: タイトルと統計 */}
        <div className="flex items-center gap-6">
          <h1 className="text-xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
            AI Parks - 東京
          </h1>

          {/* ゲーム内時間 */}
          <div
            className={`flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r ${timeColors[gameTime.timeOfDay]}`}
          >
            <span className="text-lg">{timeIcons[gameTime.timeOfDay]}</span>
            <span className="font-mono font-bold text-gray-800">{timeStr}</span>
            <span className="text-sm text-gray-600">Day {gameTime.day}</span>
          </div>

          {/* 統計 */}
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span>
              エージェント: <strong>{agents.length}</strong>
            </span>
            <span className={simulation.isRunning ? 'text-green-600' : 'text-gray-400'}>
              {simulation.isRunning ? '● シミュレーション中' : '○ 停止中'}
            </span>
          </div>
        </div>

        {/* 右側: コントロール */}
        <div className="flex items-center gap-4">
          {/* ロケーション選択 */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">場所:</span>
            <select
              value={currentLocation.id}
              onChange={(e) => {
                const loc = locations.find((l) => l.id === e.target.value);
                if (loc) setCurrentLocation(loc);
              }}
              className="border rounded px-2 py-1 text-sm"
            >
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.type === 'commercial' && '🏙️'}
                  {loc.type === 'residential' && '🏘️'}
                  {loc.type === 'office' && '🏢'}
                  {loc.type === 'park' && '🌳'}
                  {loc.type === 'station' && '🚉'}
                  {' '}{loc.name}
                </option>
              ))}
            </select>
          </div>

          {/* AIモードトグル */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">AI:</span>
            <button
              onClick={toggleAIMode}
              className={`relative w-10 h-5 rounded-full transition-colors ${
                aiMode ? 'bg-purple-500' : 'bg-gray-300'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
                  aiMode ? 'translate-x-5' : ''
                }`}
              />
            </button>
          </div>

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
              <option value={5}>5x</option>
              <option value={10}>10x</option>
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
    </div>
  );
}
