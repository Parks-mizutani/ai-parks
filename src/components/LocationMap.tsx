'use client';

import { useStore } from '@/stores/useStore';
import type { Agent, Building, LocationFeature } from '@/types';

// 各フィーチャーのアイコン
const featureIcons: Record<LocationFeature['type'], string> = {
  bench: '🪑',
  tree: '🌳',
  fountain: '⛲',
  lamp: '🏮',
  flower: '🌸',
  sign: '📍',
  vending_machine: '🥤',
  trash_can: '🗑️',
};

// 建物タイプのアイコン
const buildingIcons: Record<Building['type'], string> = {
  apartment: '🏢',
  office_building: '🏙️',
  convenience_store: '🏪',
  restaurant: '🍽️',
  cafe: '☕',
  supermarket: '🛒',
  station: '🚉',
  park: '🌳',
  shop: '🛍️',
};

interface AgentMarkerProps {
  agent: Agent;
  isSelected: boolean;
  onClick: () => void;
}

function AgentMarker({ agent, isSelected, onClick }: AgentMarkerProps) {
  const statusColors: Record<string, string> = {
    idle: 'bg-gray-100',
    walking: 'bg-blue-100',
    talking: 'bg-green-100',
    thinking: 'bg-yellow-100',
    working: 'bg-orange-100',
    eating: 'bg-pink-100',
    shopping: 'bg-purple-100',
    sleeping: 'bg-indigo-100',
    commuting: 'bg-cyan-100',
  };

  return (
    <div
      className={`absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-300 ${
        isSelected ? 'scale-125 z-30' : 'z-20'
      }`}
      style={{ left: agent.position.x, top: agent.position.y }}
      onClick={onClick}
    >
      {/* 吹き出し（話している時） */}
      {agent.status === 'talking' && agent.currentAction && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-white rounded-lg px-3 py-1 shadow-lg text-sm max-w-52 whitespace-nowrap overflow-hidden text-ellipsis border">
          {agent.currentAction}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-white" />
        </div>
      )}

      {/* エージェントのアバター */}
      <div
        className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold shadow-lg border-4 ${statusColors[agent.status] || 'bg-gray-100'} ${
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
        <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-white flex items-center justify-center text-xs shadow">
          {agent.status === 'walking' && '🚶'}
          {agent.status === 'talking' && '💬'}
          {agent.status === 'thinking' && '💭'}
          {agent.status === 'working' && '💼'}
          {agent.status === 'eating' && '🍽️'}
          {agent.status === 'shopping' && '🛍️'}
          {agent.status === 'sleeping' && '😴'}
          {agent.status === 'commuting' && '🚃'}
        </div>
      )}
    </div>
  );
}

function BuildingMarker({ building }: { building: Building }) {
  return (
    <div
      className="absolute rounded-lg shadow-md flex flex-col items-center justify-center cursor-pointer hover:shadow-lg transition-shadow"
      style={{
        left: building.position.x,
        top: building.position.y,
        width: building.size.width,
        height: building.size.height,
        backgroundColor: building.color,
        transform: 'translate(-50%, -50%)',
      }}
      title={building.name}
    >
      <span className="text-2xl">{buildingIcons[building.type]}</span>
      <span className="text-xs text-white font-medium text-center px-1 mt-1 drop-shadow-md leading-tight">
        {building.name.length > 12 ? building.name.slice(0, 12) + '...' : building.name}
      </span>
      {building.floors && (
        <span className="text-xs text-white/70">{building.floors}F</span>
      )}
    </div>
  );
}

function FeatureMarker({ feature }: { feature: LocationFeature }) {
  return (
    <div
      className="absolute transform -translate-x-1/2 -translate-y-1/2 text-2xl select-none z-10"
      style={{ left: feature.position.x, top: feature.position.y }}
      title={feature.name || feature.type}
    >
      {featureIcons[feature.type]}
    </div>
  );
}

export default function LocationMap() {
  const { currentLocation, agents, selectedAgentId, selectAgent } = useStore();

  // 現在のロケーションにいるエージェントのみ表示
  const agentsInLocation = agents.filter(
    (a) => a.currentLocationId === currentLocation.id
  );

  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* 背景 */}
      <div
        className="absolute inset-0"
        style={{
          backgroundColor: currentLocation.backgroundColor,
          backgroundImage: currentLocation.type === 'park'
            ? `radial-gradient(circle at 20% 80%, rgba(34, 139, 34, 0.3) 0%, transparent 25%),
               radial-gradient(circle at 80% 20%, rgba(34, 139, 34, 0.2) 0%, transparent 30%)`
            : currentLocation.type === 'commercial' || currentLocation.type === 'office'
            ? `linear-gradient(45deg, rgba(0,0,0,0.02) 25%, transparent 25%),
               linear-gradient(-45deg, rgba(0,0,0,0.02) 25%, transparent 25%)`
            : 'none',
        }}
      >
        {/* グリッドパターン（街用） */}
        {(currentLocation.type === 'commercial' || currentLocation.type === 'office' || currentLocation.type === 'station') && (
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)',
              backgroundSize: '80px 80px',
            }}
          />
        )}
      </div>

      {/* ロケーション名 */}
      <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm rounded-lg px-4 py-2 shadow-lg z-40">
        <div className="flex items-center gap-2">
          <span className="text-xl">
            {currentLocation.type === 'commercial' && '🏙️'}
            {currentLocation.type === 'residential' && '🏘️'}
            {currentLocation.type === 'office' && '🏢'}
            {currentLocation.type === 'park' && '🌳'}
            {currentLocation.type === 'station' && '🚉'}
          </span>
          <div>
            <h2 className="font-bold text-lg">{currentLocation.name}</h2>
            <p className="text-sm text-gray-600">{currentLocation.description}</p>
          </div>
        </div>
      </div>

      {/* 建物 */}
      {currentLocation.buildings.map((building) => (
        <BuildingMarker key={building.id} building={building} />
      ))}

      {/* フィーチャー（ベンチ、木など） */}
      {currentLocation.features.map((feature) => (
        <FeatureMarker key={feature.id} feature={feature} />
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

      {/* 現在地にいるエージェント数 */}
      <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg z-40">
        <span className="text-sm text-gray-600">
          👥 この場所: <strong>{agentsInLocation.length}</strong>人
        </span>
      </div>
    </div>
  );
}
