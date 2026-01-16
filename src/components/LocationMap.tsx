'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useStore } from '@/stores/useStore';
import { allLocations } from '@/data/locations';
import type { Agent, Building, LocationFeature, Location, Position } from '@/types';

// ワールドマップの設定
const WORLD_WIDTH = 3200;
const WORLD_HEIGHT = 2400;

// ピクセルアート風キャラクター（SVG）
function PixelCharacter({
  agent,
  isSelected,
  onClick,
  worldX,
  worldY,
}: {
  agent: Agent;
  isSelected: boolean;
  onClick: () => void;
  worldX: number;
  worldY: number;
}) {
  const isWalking = agent.status === 'walking';
  const isTalking = agent.status === 'talking';
  const isSleeping = agent.status === 'sleeping';

  const darkenColor = (hex: string, percent: number) => {
    const num = parseInt(hex.replace('#', ''), 16);
    const r = Math.max(0, (num >> 16) - Math.round(255 * percent));
    const g = Math.max(0, ((num >> 8) & 0x00ff) - Math.round(255 * percent));
    const b = Math.max(0, (num & 0x0000ff) - Math.round(255 * percent));
    return `rgb(${r},${g},${b})`;
  };

  const mainColor = agent.color;
  const darkColor = darkenColor(agent.color, 0.2);

  return (
    <div
      className={`absolute cursor-pointer transition-all duration-300 ${
        isWalking ? 'animate-walk' : ''
      } ${isTalking ? 'animate-talk' : ''}`}
      style={{
        left: worldX,
        top: worldY,
        transform: 'translate(-50%, -100%)',
        zIndex: isSelected ? 100 : 50,
      }}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
    >
      {isSelected && (
        <div
          className="absolute -top-4 left-1/2 transform -translate-x-1/2"
          style={{
            width: 0,
            height: 0,
            borderLeft: '6px solid transparent',
            borderRight: '6px solid transparent',
            borderTop: '8px solid #ffff00',
            animation: 'bounce 0.5s infinite',
          }}
        />
      )}

      {isTalking && (
        <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-lg animate-bounce">
          ♪
        </div>
      )}

      {isSleeping && (
        <div className="absolute -top-4 -right-2 text-xs font-bold text-blue-600 animate-pulse">
          Zzz
        </div>
      )}

      <svg width="32" height="40" viewBox="0 0 32 40" style={{ imageRendering: 'pixelated' }}>
        <ellipse cx="16" cy="38" rx="10" ry="3" fill="rgba(0,0,0,0.2)" />
        <rect x="10" y="30" width="5" height="8" fill="#404060" stroke="#000" strokeWidth="1" />
        <rect x="17" y="30" width="5" height="8" fill="#404060" stroke="#000" strokeWidth="1" />
        <rect x="8" y="18" width="16" height="14" fill={mainColor} stroke="#000" strokeWidth="1" rx="2" />
        <rect x="12" y="22" width="8" height="2" fill={darkColor} />
        <rect x="4" y="20" width="5" height="10" fill={mainColor} stroke="#000" strokeWidth="1" rx="1" />
        <rect x="23" y="20" width="5" height="10" fill={mainColor} stroke="#000" strokeWidth="1" rx="1" />
        <rect x="8" y="4" width="16" height="16" fill="#ffd0a0" stroke="#000" strokeWidth="1" rx="3" />
        <path
          d="M8 10 Q8 2 16 2 Q24 2 24 10 L24 8 Q24 4 16 4 Q8 4 8 8 Z"
          fill="#3a2820"
          stroke="#000"
          strokeWidth="1"
        />
        {isSleeping ? (
          <>
            <line x1="11" y1="12" x2="14" y2="12" stroke="#000" strokeWidth="2" />
            <line x1="18" y1="12" x2="21" y2="12" stroke="#000" strokeWidth="2" />
          </>
        ) : (
          <>
            <circle cx="12" cy="12" r="2" fill="#000" />
            <circle cx="20" cy="12" r="2" fill="#000" />
            <circle cx="13" cy="11" r="0.5" fill="#fff" />
            <circle cx="21" cy="11" r="0.5" fill="#fff" />
          </>
        )}
        {isTalking ? (
          <ellipse cx="16" cy="16" rx="2" ry="1.5" fill="#000" />
        ) : (
          <line x1="14" y1="16" x2="18" y2="16" stroke="#000" strokeWidth="1" />
        )}
      </svg>

      <div
        className="absolute left-1/2 transform -translate-x-1/2 mt-1 px-2 py-0.5 text-xs font-bold whitespace-nowrap"
        style={{
          backgroundColor: 'rgba(0,0,0,0.8)',
          color: '#fff',
          borderRadius: '2px',
          fontSize: '10px',
        }}
      >
        {agent.persona.name}
      </div>
    </div>
  );
}

// 建物コンポーネント
function BuildingSprite({ building, offsetX, offsetY }: { building: Building; offsetX: number; offsetY: number }) {
  const getIcon = () => {
    switch (building.type) {
      case 'apartment': return '🏢';
      case 'office_building': return '🏙️';
      case 'convenience_store': return '🏪';
      case 'restaurant': return '🍽️';
      case 'cafe': return '☕';
      case 'supermarket': return '🛒';
      case 'station': return '🚉';
      case 'park': return '🌳';
      case 'shop': return '🛍️';
      default: return '🏠';
    }
  };

  const worldX = offsetX + building.position.x;
  const worldY = offsetY + building.position.y;

  const getStyle = () => {
    const baseStyle = {
      position: 'absolute' as const,
      left: worldX - building.size.width / 2,
      top: worldY - building.size.height / 2,
      width: building.size.width,
      height: building.size.height,
      imageRendering: 'pixelated' as const,
    };

    switch (building.type) {
      case 'apartment':
        return { ...baseStyle, background: `linear-gradient(to bottom, #8b6914 0px, #8b6914 8px, ${building.color} 8px)`, border: '3px solid #202020' };
      case 'office_building':
        return { ...baseStyle, background: `linear-gradient(to bottom, #404050, #505060)`, border: '3px solid #202020' };
      case 'convenience_store':
        return { ...baseStyle, background: `linear-gradient(to bottom, #00aa00 0%, #00aa00 25%, #f0f0f0 25%)`, border: '3px solid #202020' };
      case 'cafe':
        return { ...baseStyle, background: `linear-gradient(to bottom, #2d5016 0%, #2d5016 20%, #d4a574 20%)`, border: '3px solid #202020' };
      case 'supermarket':
        return { ...baseStyle, background: `linear-gradient(to bottom, #cc0000 0%, #cc0000 20%, #f8f8f8 20%)`, border: '3px solid #202020' };
      case 'station':
        return { ...baseStyle, background: '#e8e0d0', border: '3px solid #202020', borderRadius: '8px 8px 0 0' };
      case 'restaurant':
        return { ...baseStyle, background: `linear-gradient(to bottom, #ff6b6b 0%, #ff6b6b 25%, #fff5e6 25%)`, border: '3px solid #202020' };
      default:
        return { ...baseStyle, background: building.color, border: '3px solid #202020' };
    }
  };

  return (
    <div style={getStyle()} title={building.name} className="flex flex-col items-center justify-center">
      {(building.type === 'apartment' || building.type === 'office_building') && (
        <div
          className="absolute"
          style={{
            top: '25%',
            left: '10%',
            right: '10%',
            bottom: '20%',
            background: `repeating-linear-gradient(
              to right,
              #87ceeb 0px,
              #87ceeb 10px,
              ${building.type === 'office_building' ? '#505060' : building.color} 10px,
              ${building.type === 'office_building' ? '#505060' : building.color} 16px
            )`,
            backgroundSize: '16px 100%',
          }}
        />
      )}
      <div
        className="absolute bottom-0 left-1/2 transform -translate-x-1/2"
        style={{
          width: '20%',
          height: '30%',
          background: '#5d3a1a',
          borderTop: '2px solid #202020',
          borderLeft: '2px solid #202020',
          borderRight: '2px solid #202020',
        }}
      />
      <div
        className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 px-1 text-center whitespace-nowrap"
        style={{
          background: 'rgba(255,255,255,0.9)',
          border: '1px solid #000',
          fontSize: '9px',
          fontWeight: 'bold',
        }}
      >
        {getIcon()} {building.name.slice(0, 6)}
      </div>
    </div>
  );
}

// フィーチャー（木、ベンチなど）
function FeatureSprite({ feature, offsetX, offsetY }: { feature: LocationFeature; offsetX: number; offsetY: number }) {
  const worldX = offsetX + feature.position.x;
  const worldY = offsetY + feature.position.y;

  const renderFeature = () => {
    switch (feature.type) {
      case 'tree':
        return (
          <svg width="32" height="40" viewBox="0 0 32 40" style={{ imageRendering: 'pixelated' }}>
            <rect x="13" y="28" width="6" height="12" fill="#8b4513" stroke="#5d3a1a" strokeWidth="1" />
            <circle cx="16" cy="20" r="10" fill="#228b22" stroke="#1a6b1a" strokeWidth="1" />
            <circle cx="10" cy="24" r="7" fill="#2a9b2a" stroke="#1a6b1a" strokeWidth="1" />
            <circle cx="22" cy="24" r="7" fill="#2a9b2a" stroke="#1a6b1a" strokeWidth="1" />
            <circle cx="16" cy="14" r="6" fill="#32ab32" stroke="#1a6b1a" strokeWidth="1" />
          </svg>
        );
      case 'bench':
        return (
          <svg width="32" height="20" viewBox="0 0 32 20" style={{ imageRendering: 'pixelated' }}>
            <rect x="2" y="6" width="28" height="6" fill="#8b4513" stroke="#5d3a1a" strokeWidth="1" rx="1" />
            <rect x="4" y="12" width="4" height="8" fill="#5d3a1a" stroke="#3d2817" strokeWidth="1" />
            <rect x="24" y="12" width="4" height="8" fill="#5d3a1a" stroke="#3d2817" strokeWidth="1" />
            <rect x="2" y="0" width="28" height="4" fill="#a05a2c" stroke="#5d3a1a" strokeWidth="1" rx="1" />
          </svg>
        );
      case 'lamp':
        return (
          <svg width="16" height="40" viewBox="0 0 16 40" style={{ imageRendering: 'pixelated' }}>
            <ellipse cx="8" cy="8" rx="8" ry="6" fill="rgba(255,215,0,0.3)" />
            <rect x="4" y="2" width="8" height="10" fill="#ffd700" stroke="#b8860b" strokeWidth="1" rx="2" />
            <rect x="6" y="12" width="4" height="28" fill="#404040" stroke="#202020" strokeWidth="1" />
          </svg>
        );
      case 'vending_machine':
        return (
          <svg width="24" height="36" viewBox="0 0 24 36" style={{ imageRendering: 'pixelated' }}>
            <rect x="2" y="2" width="20" height="32" fill="#cc0000" stroke="#202020" strokeWidth="2" rx="2" />
            <rect x="4" y="4" width="16" height="6" fill="#ffffff" />
            <rect x="4" y="12" width="16" height="14" fill="#000" />
            <rect x="6" y="14" width="4" height="4" fill="#00ff00" />
            <rect x="11" y="14" width="4" height="4" fill="#ff6600" />
            <rect x="16" y="14" width="2" height="4" fill="#0066ff" />
            <rect x="6" y="28" width="12" height="4" fill="#333" />
          </svg>
        );
      case 'fountain':
        return (
          <svg width="48" height="32" viewBox="0 0 48 32" style={{ imageRendering: 'pixelated' }}>
            <ellipse cx="24" cy="28" rx="22" ry="4" fill="#a0a0a0" stroke="#606060" strokeWidth="2" />
            <ellipse cx="24" cy="24" rx="18" ry="3" fill="#4080c0" />
            <rect x="20" y="8" width="8" height="18" fill="#c0c0c0" stroke="#808080" strokeWidth="1" />
            <ellipse cx="24" cy="6" rx="4" ry="2" fill="#87ceeb" />
          </svg>
        );
      case 'flower':
        return (
          <svg width="24" height="16" viewBox="0 0 24 16" style={{ imageRendering: 'pixelated' }}>
            <rect x="0" y="10" width="24" height="6" fill="#654321" stroke="#3d2817" strokeWidth="1" />
            <circle cx="6" cy="6" r="4" fill="#ff69b4" />
            <circle cx="12" cy="4" r="4" fill="#ffff00" />
            <circle cx="18" cy="6" r="4" fill="#ff69b4" />
            <rect x="5" y="6" width="2" height="6" fill="#228b22" />
            <rect x="11" y="4" width="2" height="8" fill="#228b22" />
            <rect x="17" y="6" width="2" height="6" fill="#228b22" />
          </svg>
        );
      case 'sign':
        return (
          <svg width="24" height="32" viewBox="0 0 24 32" style={{ imageRendering: 'pixelated' }}>
            <rect x="2" y="2" width="20" height="14" fill="#ffffff" stroke="#202020" strokeWidth="2" />
            <text x="12" y="12" textAnchor="middle" fontSize="8" fill="#ff0000">!</text>
            <rect x="10" y="16" width="4" height="16" fill="#808080" stroke="#404040" strokeWidth="1" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div
      className="absolute"
      style={{
        left: worldX,
        top: worldY,
        transform: 'translate(-50%, -50%)',
        zIndex: 10,
      }}
    >
      {renderFeature()}
    </div>
  );
}

// ロケーションエリア（地面と境界）
function LocationArea({ location }: { location: Location }) {
  const worldX = location.worldPosition?.x || 0;
  const worldY = location.worldPosition?.y || 0;

  const getGroundStyle = () => {
    switch (location.type) {
      case 'park':
        return {
          backgroundColor: '#6b8e23',
          backgroundImage: `
            radial-gradient(circle at 20% 30%, #5a7d12 3px, transparent 3px),
            radial-gradient(circle at 60% 70%, #5a7d12 3px, transparent 3px),
            radial-gradient(circle at 80% 20%, #5a7d12 3px, transparent 3px),
            radial-gradient(circle at 40% 80%, #7c9f34 2px, transparent 2px)
          `,
          backgroundSize: '48px 48px',
        };
      case 'residential':
        return {
          backgroundColor: '#8fbc8f',
          backgroundImage: `
            linear-gradient(90deg, #7cac7c 1px, transparent 1px),
            linear-gradient(180deg, #7cac7c 1px, transparent 1px)
          `,
          backgroundSize: '24px 24px',
        };
      case 'station':
        return {
          backgroundColor: '#d0d0d0',
          backgroundImage: `
            linear-gradient(90deg, #c0c0c0 2px, transparent 2px),
            linear-gradient(180deg, #c0c0c0 2px, transparent 2px)
          `,
          backgroundSize: '32px 32px',
        };
      default:
        return {
          backgroundColor: '#b0b0b0',
          backgroundImage: `
            linear-gradient(90deg, #a0a0a0 2px, transparent 2px),
            linear-gradient(180deg, #a0a0a0 2px, transparent 2px)
          `,
          backgroundSize: '32px 32px',
        };
    }
  };

  return (
    <div
      className="absolute border-4 border-dashed border-gray-600"
      style={{
        left: worldX,
        top: worldY,
        width: location.width,
        height: location.height,
        ...getGroundStyle(),
      }}
    >
      {/* ロケーション名ラベル */}
      <div
        className="absolute top-2 left-2 px-2 py-1 text-xs font-bold"
        style={{
          background: 'rgba(0,0,0,0.7)',
          color: '#fff',
          borderRadius: '4px',
        }}
      >
        {location.type === 'commercial' && '🏙️'}
        {location.type === 'residential' && '🏘️'}
        {location.type === 'office' && '🏢'}
        {location.type === 'park' && '🌳'}
        {location.type === 'station' && '🚉'}
        {' '}{location.name}
      </div>
    </div>
  );
}

// 道路（ロケーション間の接続）
function Roads() {
  const roads: { from: Position; to: Position }[] = [];

  const getCenter = (loc: Location): Position => ({
    x: (loc.worldPosition?.x || 0) + loc.width / 2,
    y: (loc.worldPosition?.y || 0) + loc.height / 2,
  });

  const locationMap = new Map(allLocations.map(l => [l.id, l]));
  const drawnConnections = new Set<string>();

  allLocations.forEach(loc => {
    loc.connectedTo.forEach(connectedId => {
      const connKey = [loc.id, connectedId].sort().join('-');
      if (drawnConnections.has(connKey)) return;
      drawnConnections.add(connKey);

      const connected = locationMap.get(connectedId);
      if (connected) {
        roads.push({ from: getCenter(loc), to: getCenter(connected) });
      }
    });
  });

  return (
    <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 1 }}>
      {roads.map((road, i) => (
        <g key={i}>
          <line
            x1={road.from.x}
            y1={road.from.y}
            x2={road.to.x}
            y2={road.to.y}
            stroke="#555"
            strokeWidth="50"
            strokeLinecap="round"
          />
          <line
            x1={road.from.x}
            y1={road.from.y}
            x2={road.to.x}
            y2={road.to.y}
            stroke="#666"
            strokeWidth="40"
            strokeLinecap="round"
          />
          <line
            x1={road.from.x}
            y1={road.from.y}
            x2={road.to.x}
            y2={road.to.y}
            stroke="#fff"
            strokeWidth="3"
            strokeDasharray="20,15"
            strokeLinecap="round"
          />
        </g>
      ))}
    </svg>
  );
}

export default function LocationMap() {
  const { agents, selectedAgentId, selectAgent, simulation } = useStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const [viewOffset, setViewOffset] = useState({ x: -600, y: -200 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(0.6);

  const { timeOfDay } = simulation.gameTime;

  // エージェントのワールド座標を計算
  const getAgentWorldPosition = useCallback((agent: Agent): Position => {
    const loc = allLocations.find(l => l.id === agent.currentLocationId);
    if (!loc || !loc.worldPosition) {
      return { x: agent.position.x, y: agent.position.y };
    }
    return {
      x: loc.worldPosition.x + agent.position.x,
      y: loc.worldPosition.y + agent.position.y,
    };
  }, []);

  // 選択したエージェントにフォーカス
  useEffect(() => {
    if (selectedAgentId) {
      const agent = agents.find(a => a.id === selectedAgentId);
      if (agent && containerRef.current) {
        const worldPos = getAgentWorldPosition(agent);
        const containerRect = containerRef.current.getBoundingClientRect();
        setViewOffset({
          x: -worldPos.x * scale + containerRect.width / 2,
          y: -worldPos.y * scale + containerRect.height / 2,
        });
      }
    }
  }, [selectedAgentId, agents, getAgentWorldPosition, scale]);

  // ドラッグ開始
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - viewOffset.x, y: e.clientY - viewOffset.y });
  }, [viewOffset]);

  // ドラッグ中
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;
    setViewOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  }, [isDragging, dragStart]);

  // ドラッグ終了
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // マウスがコンテナ外に出た場合
  const handleMouseLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  // ズーム
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setScale(prev => Math.max(0.3, Math.min(1.5, prev + delta)));
  }, []);

  return (
    <div
      ref={containerRef}
      className="retro-ui relative w-full h-full overflow-hidden cursor-grab"
      style={{ backgroundColor: '#4a6741' }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onWheel={handleWheel}
    >
      {/* ワールドコンテナ */}
      <div
        className="absolute"
        style={{
          width: WORLD_WIDTH,
          height: WORLD_HEIGHT,
          transform: `translate(${viewOffset.x}px, ${viewOffset.y}px) scale(${scale})`,
          transformOrigin: '0 0',
          cursor: isDragging ? 'grabbing' : 'grab',
        }}
      >
        {/* 道路 */}
        <Roads />

        {/* ロケーションエリア */}
        {allLocations.map(location => (
          <LocationArea key={location.id} location={location} />
        ))}

        {/* 建物 */}
        {allLocations.map(location => (
          location.buildings.map(building => (
            <BuildingSprite
              key={building.id}
              building={building}
              offsetX={location.worldPosition?.x || 0}
              offsetY={location.worldPosition?.y || 0}
            />
          ))
        ))}

        {/* フィーチャー */}
        {allLocations.map(location => (
          location.features.map(feature => (
            <FeatureSprite
              key={feature.id}
              feature={feature}
              offsetX={location.worldPosition?.x || 0}
              offsetY={location.worldPosition?.y || 0}
            />
          ))
        ))}

        {/* エージェント */}
        {agents.map(agent => {
          const worldPos = getAgentWorldPosition(agent);
          return (
            <PixelCharacter
              key={agent.id}
              agent={agent}
              isSelected={selectedAgentId === agent.id}
              onClick={() => selectAgent(selectedAgentId === agent.id ? null : agent.id)}
              worldX={worldPos.x}
              worldY={worldPos.y}
            />
          );
        })}
      </div>

      {/* 時間帯オーバーレイ */}
      {timeOfDay === 'night' && (
        <div className="absolute inset-0 bg-blue-900/40 pointer-events-none z-40" />
      )}
      {timeOfDay === 'evening' && (
        <div className="absolute inset-0 bg-orange-500/20 pointer-events-none z-40" />
      )}

      {/* コントロール（ズーム） */}
      <div className="absolute bottom-3 right-3 flex flex-col gap-1 z-50">
        <button
          onClick={() => setScale(prev => Math.min(1.5, prev + 0.1))}
          className="retro-button w-8 h-8 flex items-center justify-center text-lg"
        >
          +
        </button>
        <button
          onClick={() => setScale(prev => Math.max(0.3, prev - 0.1))}
          className="retro-button w-8 h-8 flex items-center justify-center text-lg"
        >
          −
        </button>
        <div className="text-xs text-center bg-white/80 px-1 rounded">
          {Math.round(scale * 100)}%
        </div>
      </div>

      {/* 操作説明 */}
      <div className="absolute bottom-3 left-3 retro-box-simple z-50 text-xs">
        <div>▸ ドラッグ: 移動</div>
        <div>▸ ホイール: ズーム</div>
        <div>▸ {agents.length}にん がいる</div>
      </div>

      {/* ミニマップ */}
      <div
        className="absolute top-3 right-3 border-2 border-black bg-white/80 z-50"
        style={{ width: 120, height: 90 }}
      >
        <svg width="120" height="90" viewBox={`0 0 ${WORLD_WIDTH} ${WORLD_HEIGHT}`}>
          {/* ロケーション */}
          {allLocations.map(loc => (
            <rect
              key={loc.id}
              x={loc.worldPosition?.x || 0}
              y={loc.worldPosition?.y || 0}
              width={loc.width}
              height={loc.height}
              fill={
                loc.type === 'park' ? '#6b8e23' :
                loc.type === 'residential' ? '#8fbc8f' :
                loc.type === 'station' ? '#d0d0d0' :
                '#b0b0b0'
              }
              stroke="#333"
              strokeWidth="20"
            />
          ))}
          {/* ビューポート */}
          {containerRef.current && (
            <rect
              x={-viewOffset.x / scale}
              y={-viewOffset.y / scale}
              width={containerRef.current.clientWidth / scale}
              height={containerRef.current.clientHeight / scale}
              fill="none"
              stroke="#ff0000"
              strokeWidth="30"
            />
          )}
          {/* エージェント */}
          {agents.map(agent => {
            const pos = getAgentWorldPosition(agent);
            return (
              <circle
                key={agent.id}
                cx={pos.x}
                cy={pos.y}
                r={30}
                fill={agent.color}
                stroke={selectedAgentId === agent.id ? '#ff0' : '#000'}
                strokeWidth={selectedAgentId === agent.id ? 20 : 10}
              />
            );
          })}
        </svg>
      </div>
    </div>
  );
}
