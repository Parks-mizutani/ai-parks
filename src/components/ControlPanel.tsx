'use client';

import { useState, useEffect } from 'react';
import { useStore } from '@/stores/useStore';

// 時間帯のアイコン（レトロ風）
const timeIcons = {
  morning: '☼',
  afternoon: '●',
  evening: '◐',
  night: '☽',
};

// API状態チェック
function useApiStatus() {
  const [apiConfigured, setApiConfigured] = useState<boolean | null>(null);

  useEffect(() => {
    // APIエンドポイントにテストリクエスト
    fetch('/api/agents/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agents: [], park: { name: 'test' }, test: true }),
    })
      .then(res => res.json())
      .then(data => {
        // モックレスポンスかどうかでAPIキーの有無を判断
        const isMock = data.responses?.some((r: { speech?: string }) => r.speech?.includes('考えています'));
        setApiConfigured(!isMock);
      })
      .catch(() => setApiConfigured(false));
  }, []);

  return apiConfigured;
}

export default function ControlPanel() {
  const {
    simulation,
    toggleSimulation,
    setSimulationSpeed,
    agents,
    aiMode,
    toggleAIMode,
  } = useStore();

  const apiConfigured = useApiStatus();
  const { gameTime } = simulation;
  const timeStr = `${gameTime.hour.toString().padStart(2, '0')}:${gameTime.minute.toString().padStart(2, '0')}`;

  return (
    <div className="retro-ui retro-box-simple m-0" style={{ borderRadius: 0 }}>
      <div className="flex items-center justify-between flex-wrap gap-2">
        {/* 左側: タイトルと統計 */}
        <div className="flex items-center gap-4">
          <div className="retro-title">
            AI PARKS - TOKYO
          </div>

          {/* ゲーム内時間 */}
          <div className="flex items-center gap-2 px-3 py-1 border-2 border-black bg-white">
            <span className="text-lg">{timeIcons[gameTime.timeOfDay]}</span>
            <span className="font-bold">{timeStr}</span>
            <span className="text-sm text-gray-600">Day{gameTime.day}</span>
          </div>

          {/* 統計 */}
          <div className="text-sm">
            ▸ {agents.length}にん
            <span className={`ml-3 ${simulation.isRunning ? 'text-green-700' : 'text-gray-400'}`}>
              {simulation.isRunning ? '● RUN' : '○ STOP'}
            </span>
          </div>
        </div>

        {/* 右側: コントロール */}
        <div className="flex items-center gap-3">
          {/* AIモードトグル */}
          <div className="flex items-center gap-2">
            <span className="text-sm">AI:</span>
            <button
              onClick={toggleAIMode}
              className={`retro-button text-sm py-1 px-3 ${
                aiMode ? 'bg-black text-white' : ''
              }`}
              title={apiConfigured === false ? 'GEMINI_API_KEY未設定' : undefined}
            >
              {aiMode ? 'ON' : 'OFF'}
            </button>
            {/* API状態インジケータ */}
            {apiConfigured === false && aiMode && (
              <span className="text-xs text-red-600 animate-pulse" title=".env.localにGEMINI_API_KEYを設定してください">
                ⚠️ APIキー未設定
              </span>
            )}
            {apiConfigured === true && aiMode && (
              <span className="text-xs text-green-600">
                ✓ Gemini
              </span>
            )}
          </div>

          {/* スピード調整 */}
          <div className="flex items-center gap-2">
            <span className="text-sm">そくど:</span>
            <select
              value={simulation.speed}
              onChange={(e) => setSimulationSpeed(Number(e.target.value))}
              className="retro-select text-sm"
            >
              <option value={0.5}>x0.5</option>
              <option value={1}>x1</option>
              <option value={2}>x2</option>
              <option value={5}>x5</option>
              <option value={10}>x10</option>
            </select>
          </div>

          {/* 再生/停止ボタン */}
          <button
            onClick={toggleSimulation}
            className={`retro-button px-4 py-1 font-bold ${
              simulation.isRunning
                ? 'bg-black text-white'
                : ''
            }`}
          >
            {simulation.isRunning ? '■ STOP' : '▶ START'}
          </button>
        </div>
      </div>
    </div>
  );
}
