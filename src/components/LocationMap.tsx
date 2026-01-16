'use client';

import { useStore } from '@/stores/useStore';
import type { Agent, Building, LocationFeature } from '@/types';

// 各フィーチャーのアイコン（ドット絵風）
const featureIcons: Record<LocationFeature['type'], string> = {
  bench: '■',
  tree: '♣',
  fountain: '◆',
  lamp: '○',
  flower: '✿',
  sign: '!',
  vending_machine: '▣',
  trash_can: '□',
};

// 建物タイプのアイコン
const buildingIcons: Record<Building['type'], string> = {
  apartment: '▓',
  office_building: '█',
  convenience_store: '▒',
  restaurant: '▤',
  cafe: '▥',
  supermarket: '▦',
  station: '▧',
  park: '♣',
  shop: '▨',
};

interface AgentMarkerProps {
  agent: Agent;
  isSelected: boolean;
  onClick: () => void;
}

function AgentMarker({ agent, isSelected, onClick }: AgentMarkerProps) {
  return (
    <div
      className={`agent-sprite ${agent.status === 'talking' ? 'talking' : ''} ${
        isSelected ? 'ring-2 ring-yellow-400 ring-offset-2' : ''
      }`}
      style={{
        left: agent.position.x,
        top: agent.position.y,
        backgroundColor: agent.color,
        transform: 'translate(-50%, -50%)',
      }}
      onClick={onClick}
    >
      {agent.persona.name.charAt(0)}
    </div>
  );
}

function RetroBuilding({ building }: { building: Building }) {
  // タイル数を計算
  const tilesX = Math.floor(building.size.width / 32);
  const tilesY = Math.floor(building.size.height / 32);

  return (
    <div
      className="absolute"
      style={{
        left: building.position.x - building.size.width / 2,
        top: building.position.y - building.size.height / 2,
        width: building.size.width,
        height: building.size.height,
      }}
    >
      {/* 建物本体 */}
      <div
        className="w-full h-full border-3 flex flex-col items-center justify-center cursor-pointer
          hover:brightness-110 transition-all"
        style={{
          backgroundColor: building.color,
          borderColor: '#202020',
          borderWidth: '3px',
          imageRendering: 'pixelated',
        }}
        title={building.name}
      >
        {/* 屋根（複数階の場合） */}
        {building.floors && building.floors > 1 && (
          <div
            className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-3/4 h-2"
            style={{ backgroundColor: '#a05030', borderRadius: '2px 2px 0 0' }}
          />
        )}
        {/* ドア */}
        <div
          className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-6 h-8"
          style={{ backgroundColor: '#6b4423' }}
        />
        {/* 窓 */}
        {tilesY > 1 && (
          <div className="flex gap-2 mb-4">
            <div className="w-4 h-4 bg-blue-200 border border-gray-600" />
            <div className="w-4 h-4 bg-blue-200 border border-gray-600" />
          </div>
        )}
        {/* 名前 */}
        <span className="text-xs font-bold text-white drop-shadow-[1px_1px_0_#000] text-center px-1 leading-tight">
          {building.name.length > 8 ? building.name.slice(0, 8) : building.name}
        </span>
      </div>
    </div>
  );
}

function RetroFeature({ feature }: { feature: LocationFeature }) {
  const featureStyles: Record<LocationFeature['type'], { bg: string; color: string }> = {
    tree: { bg: '#228b22', color: '#90ee90' },
    bench: { bg: '#8b4513', color: '#d2691e' },
    fountain: { bg: '#4169e1', color: '#87cefa' },
    lamp: { bg: '#ffd700', color: '#fff' },
    flower: { bg: '#ff69b4', color: '#ffb6c1' },
    sign: { bg: '#ff6347', color: '#fff' },
    vending_machine: { bg: '#ff4500', color: '#fff' },
    trash_can: { bg: '#696969', color: '#a9a9a9' },
  };

  const style = featureStyles[feature.type];

  return (
    <div
      className="absolute w-8 h-8 flex items-center justify-center font-bold text-lg select-none"
      style={{
        left: feature.position.x,
        top: feature.position.y,
        transform: 'translate(-50%, -50%)',
        backgroundColor: style.bg,
        color: style.color,
        border: '2px solid #202020',
        imageRendering: 'pixelated',
      }}
      title={feature.name || feature.type}
    >
      {featureIcons[feature.type]}
    </div>
  );
}

export default function LocationMap() {
  const { currentLocation, agents, selectedAgentId, selectAgent, simulation } = useStore();

  // 現在のロケーションにいるエージェントのみ表示
  const agentsInLocation = agents.filter(
    (a) => a.currentLocationId === currentLocation.id
  );

  // 時間帯によるフィルター
  const timeFilter = {
    morning: 'brightness(1.1) saturate(0.9)',
    afternoon: 'brightness(1.0)',
    evening: 'brightness(0.85) sepia(0.3)',
    night: 'brightness(0.5) saturate(0.7)',
  }[simulation.gameTime.timeOfDay];

  // 地面のタイルパターンを生成
  const groundPattern = currentLocation.type === 'park'
    ? 'linear-gradient(45deg, #6b8e23 25%, #7cba3d 25%, #7cba3d 50%, #6b8e23 50%, #6b8e23 75%, #7cba3d 75%)'
    : currentLocation.type === 'residential'
    ? 'linear-gradient(45deg, #c8b88c 25%, #d4c9a0 25%, #d4c9a0 50%, #c8b88c 50%, #c8b88c 75%, #d4c9a0 75%)'
    : 'linear-gradient(45deg, #a0a0a0 25%, #b0b0b0 25%, #b0b0b0 50%, #a0a0a0 50%, #a0a0a0 75%, #b0b0b0 75%)';

  return (
    <div
      className="retro-ui relative w-full h-full overflow-hidden"
      style={{ filter: timeFilter }}
    >
      {/* タイル状の地面 */}
      <div
        className="absolute inset-0"
        style={{
          backgroundColor: currentLocation.backgroundColor,
          backgroundImage: groundPattern,
          backgroundSize: '32px 32px',
          imageRendering: 'pixelated',
        }}
      />

      {/* 道路（商業・オフィス地区） */}
      {(currentLocation.type === 'commercial' || currentLocation.type === 'office' || currentLocation.type === 'station') && (
        <div
          className="absolute left-0 right-0 h-16"
          style={{
            top: '50%',
            transform: 'translateY(-50%)',
            backgroundColor: '#505050',
            borderTop: '4px solid #fff',
            borderBottom: '4px solid #fff',
          }}
        >
          {/* 道路の中央線 */}
          <div
            className="absolute top-1/2 left-0 right-0 h-1 transform -translate-y-1/2"
            style={{
              backgroundImage: 'repeating-linear-gradient(90deg, #fff 0px, #fff 20px, transparent 20px, transparent 40px)',
            }}
          />
        </div>
      )}

      {/* 建物 */}
      {currentLocation.buildings.map((building) => (
        <RetroBuilding key={building.id} building={building} />
      ))}

      {/* フィーチャー */}
      {currentLocation.features.map((feature) => (
        <RetroFeature key={feature.id} feature={feature} />
      ))}

      {/* エージェント */}
      {agentsInLocation.map((agent) => (
        <AgentMarker
          key={agent.id}
          agent={agent}
          isSelected={selectedAgentId === agent.id}
          onClick={() => selectAgent(selectedAgentId === agent.id ? null : agent.id)}
        />
      ))}

      {/* ロケーション名（レトロボックス） */}
      <div className="absolute top-3 left-3 retro-box z-40">
        <div className="flex items-center gap-2">
          <span className="text-lg">
            {currentLocation.type === 'commercial' && '▓'}
            {currentLocation.type === 'residential' && '▒'}
            {currentLocation.type === 'office' && '█'}
            {currentLocation.type === 'park' && '♣'}
            {currentLocation.type === 'station' && '▧'}
          </span>
          <div>
            <div className="font-bold">{currentLocation.name}</div>
            <div className="text-xs text-gray-600">{currentLocation.description}</div>
          </div>
        </div>
      </div>

      {/* エージェント数表示 */}
      <div className="absolute bottom-3 left-3 retro-box-simple z-40">
        <span className="text-sm">
          ▸ {agentsInLocation.length}人がいる
        </span>
      </div>
    </div>
  );
}
