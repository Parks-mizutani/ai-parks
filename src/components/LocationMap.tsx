'use client';

import { useStore } from '@/stores/useStore';
import type { Agent, Building, LocationFeature } from '@/types';

// ピクセルアート風キャラクター（SVG）
function PixelCharacter({
  agent,
  isSelected,
  onClick,
}: {
  agent: Agent;
  isSelected: boolean;
  onClick: () => void;
}) {
  const isWalking = agent.status === 'walking';
  const isTalking = agent.status === 'talking';
  const isSleeping = agent.status === 'sleeping';

  // 色をやや暗くした色を計算
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
        left: agent.position.x,
        top: agent.position.y,
        transform: 'translate(-50%, -100%)',
        zIndex: isSelected ? 50 : 20,
      }}
      onClick={onClick}
    >
      {/* 選択インジケーター */}
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

      {/* 会話中の吹き出し */}
      {isTalking && (
        <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-lg animate-bounce">
          ♪
        </div>
      )}

      {/* 睡眠中のZzz */}
      {isSleeping && (
        <div className="absolute -top-4 -right-2 text-xs font-bold text-blue-600 animate-pulse">
          Zzz
        </div>
      )}

      {/* キャラクターSVG */}
      <svg
        width="32"
        height="40"
        viewBox="0 0 32 40"
        style={{ imageRendering: 'pixelated' }}
      >
        {/* 影 */}
        <ellipse cx="16" cy="38" rx="10" ry="3" fill="rgba(0,0,0,0.2)" />

        {/* 足 */}
        <rect x="10" y="30" width="5" height="8" fill="#404060" stroke="#000" strokeWidth="1" />
        <rect x="17" y="30" width="5" height="8" fill="#404060" stroke="#000" strokeWidth="1" />

        {/* 体 */}
        <rect x="8" y="18" width="16" height="14" fill={mainColor} stroke="#000" strokeWidth="1" rx="2" />
        {/* 服の模様 */}
        <rect x="12" y="22" width="8" height="2" fill={darkColor} />

        {/* 腕 */}
        <rect x="4" y="20" width="5" height="10" fill={mainColor} stroke="#000" strokeWidth="1" rx="1" />
        <rect x="23" y="20" width="5" height="10" fill={mainColor} stroke="#000" strokeWidth="1" rx="1" />

        {/* 頭 */}
        <rect x="8" y="4" width="16" height="16" fill="#ffd0a0" stroke="#000" strokeWidth="1" rx="3" />

        {/* 髪の毛 */}
        <path
          d="M8 10 Q8 2 16 2 Q24 2 24 10 L24 8 Q24 4 16 4 Q8 4 8 8 Z"
          fill="#3a2820"
          stroke="#000"
          strokeWidth="1"
        />

        {/* 目 */}
        {isSleeping ? (
          <>
            <line x1="11" y1="12" x2="14" y2="12" stroke="#000" strokeWidth="2" />
            <line x1="18" y1="12" x2="21" y2="12" stroke="#000" strokeWidth="2" />
          </>
        ) : (
          <>
            <circle cx="12" cy="12" r="2" fill="#000" />
            <circle cx="20" cy="12" r="2" fill="#000" />
            {/* 目のハイライト */}
            <circle cx="13" cy="11" r="0.5" fill="#fff" />
            <circle cx="21" cy="11" r="0.5" fill="#fff" />
          </>
        )}

        {/* 口 */}
        {isTalking ? (
          <ellipse cx="16" cy="16" rx="2" ry="1.5" fill="#000" />
        ) : (
          <line x1="14" y1="16" x2="18" y2="16" stroke="#000" strokeWidth="1" />
        )}
      </svg>

      {/* 名前プレート */}
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
function BuildingSprite({ building }: { building: Building }) {
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

  const getStyle = () => {
    const baseStyle = {
      position: 'absolute' as const,
      left: building.position.x - building.size.width / 2,
      top: building.position.y - building.size.height / 2,
      width: building.size.width,
      height: building.size.height,
      imageRendering: 'pixelated' as const,
    };

    switch (building.type) {
      case 'apartment':
        return {
          ...baseStyle,
          background: `linear-gradient(to bottom, #8b6914 0px, #8b6914 8px, ${building.color} 8px)`,
          border: '3px solid #202020',
        };
      case 'office_building':
        return {
          ...baseStyle,
          background: `linear-gradient(to bottom, #404050, #505060)`,
          border: '3px solid #202020',
        };
      case 'convenience_store':
        return {
          ...baseStyle,
          background: `linear-gradient(to bottom, #00aa00 0%, #00aa00 25%, #f0f0f0 25%)`,
          border: '3px solid #202020',
        };
      case 'cafe':
        return {
          ...baseStyle,
          background: `linear-gradient(to bottom, #2d5016 0%, #2d5016 20%, #d4a574 20%)`,
          border: '3px solid #202020',
        };
      case 'supermarket':
        return {
          ...baseStyle,
          background: `linear-gradient(to bottom, #cc0000 0%, #cc0000 20%, #f8f8f8 20%)`,
          border: '3px solid #202020',
        };
      case 'station':
        return {
          ...baseStyle,
          background: '#e8e0d0',
          border: '3px solid #202020',
          borderRadius: '8px 8px 0 0',
        };
      case 'restaurant':
        return {
          ...baseStyle,
          background: `linear-gradient(to bottom, #ff6b6b 0%, #ff6b6b 25%, #fff5e6 25%)`,
          border: '3px solid #202020',
        };
      default:
        return {
          ...baseStyle,
          background: building.color,
          border: '3px solid #202020',
        };
    }
  };

  return (
    <div style={getStyle()} title={building.name} className="flex flex-col items-center justify-center">
      {/* 窓のパターン */}
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

      {/* ドア */}
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

      {/* 建物名 */}
      <div
        className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 px-1 text-center whitespace-nowrap"
        style={{
          background: 'rgba(255,255,255,0.9)',
          border: '1px solid #000',
          fontSize: '10px',
          fontWeight: 'bold',
        }}
      >
        {getIcon()} {building.name.slice(0, 6)}
      </div>
    </div>
  );
}

// フィーチャー（木、ベンチなど）
function FeatureSprite({ feature }: { feature: LocationFeature }) {
  const renderFeature = () => {
    switch (feature.type) {
      case 'tree':
        return (
          <svg width="32" height="40" viewBox="0 0 32 40" style={{ imageRendering: 'pixelated' }}>
            {/* 幹 */}
            <rect x="13" y="28" width="6" height="12" fill="#8b4513" stroke="#5d3a1a" strokeWidth="1" />
            {/* 葉（3層） */}
            <circle cx="16" cy="20" r="10" fill="#228b22" stroke="#1a6b1a" strokeWidth="1" />
            <circle cx="10" cy="24" r="7" fill="#2a9b2a" stroke="#1a6b1a" strokeWidth="1" />
            <circle cx="22" cy="24" r="7" fill="#2a9b2a" stroke="#1a6b1a" strokeWidth="1" />
            <circle cx="16" cy="14" r="6" fill="#32ab32" stroke="#1a6b1a" strokeWidth="1" />
          </svg>
        );
      case 'bench':
        return (
          <svg width="32" height="20" viewBox="0 0 32 20" style={{ imageRendering: 'pixelated' }}>
            {/* 座面 */}
            <rect x="2" y="6" width="28" height="6" fill="#8b4513" stroke="#5d3a1a" strokeWidth="1" rx="1" />
            {/* 足 */}
            <rect x="4" y="12" width="4" height="8" fill="#5d3a1a" stroke="#3d2817" strokeWidth="1" />
            <rect x="24" y="12" width="4" height="8" fill="#5d3a1a" stroke="#3d2817" strokeWidth="1" />
            {/* 背もたれ */}
            <rect x="2" y="0" width="28" height="4" fill="#a05a2c" stroke="#5d3a1a" strokeWidth="1" rx="1" />
          </svg>
        );
      case 'lamp':
        return (
          <svg width="16" height="40" viewBox="0 0 16 40" style={{ imageRendering: 'pixelated' }}>
            {/* 光 */}
            <ellipse cx="8" cy="8" rx="8" ry="6" fill="rgba(255,215,0,0.3)" />
            {/* ランプ */}
            <rect x="4" y="2" width="8" height="10" fill="#ffd700" stroke="#b8860b" strokeWidth="1" rx="2" />
            {/* 柱 */}
            <rect x="6" y="12" width="4" height="28" fill="#404040" stroke="#202020" strokeWidth="1" />
          </svg>
        );
      case 'vending_machine':
        return (
          <svg width="24" height="36" viewBox="0 0 24 36" style={{ imageRendering: 'pixelated' }}>
            {/* 本体 */}
            <rect x="2" y="2" width="20" height="32" fill="#cc0000" stroke="#202020" strokeWidth="2" rx="2" />
            {/* 上部ロゴ */}
            <rect x="4" y="4" width="16" height="6" fill="#ffffff" />
            {/* ディスプレイ */}
            <rect x="4" y="12" width="16" height="14" fill="#000" />
            {/* 商品 */}
            <rect x="6" y="14" width="4" height="4" fill="#00ff00" />
            <rect x="11" y="14" width="4" height="4" fill="#ff6600" />
            <rect x="16" y="14" width="2" height="4" fill="#0066ff" />
            <rect x="6" y="20" width="4" height="4" fill="#ff0066" />
            <rect x="11" y="20" width="4" height="4" fill="#ffff00" />
            {/* 取り出し口 */}
            <rect x="6" y="28" width="12" height="4" fill="#333" />
          </svg>
        );
      case 'fountain':
        return (
          <svg width="48" height="32" viewBox="0 0 48 32" style={{ imageRendering: 'pixelated' }}>
            {/* 水盤 */}
            <ellipse cx="24" cy="28" rx="22" ry="4" fill="#a0a0a0" stroke="#606060" strokeWidth="2" />
            <ellipse cx="24" cy="24" rx="18" ry="3" fill="#4080c0" />
            {/* 中央の柱 */}
            <rect x="20" y="8" width="8" height="18" fill="#c0c0c0" stroke="#808080" strokeWidth="1" />
            {/* 水 */}
            <path d="M24 4 Q20 0 24 -4 Q28 0 24 4" fill="#87ceeb" />
            <ellipse cx="24" cy="6" rx="4" ry="2" fill="#87ceeb" />
          </svg>
        );
      case 'flower':
        return (
          <svg width="24" height="16" viewBox="0 0 24 16" style={{ imageRendering: 'pixelated' }}>
            {/* 土 */}
            <rect x="0" y="10" width="24" height="6" fill="#654321" stroke="#3d2817" strokeWidth="1" />
            {/* 花 */}
            <circle cx="6" cy="6" r="4" fill="#ff69b4" />
            <circle cx="12" cy="4" r="4" fill="#ffff00" />
            <circle cx="18" cy="6" r="4" fill="#ff69b4" />
            {/* 茎 */}
            <rect x="5" y="6" width="2" height="6" fill="#228b22" />
            <rect x="11" y="4" width="2" height="8" fill="#228b22" />
            <rect x="17" y="6" width="2" height="6" fill="#228b22" />
          </svg>
        );
      case 'sign':
        return (
          <svg width="24" height="32" viewBox="0 0 24 32" style={{ imageRendering: 'pixelated' }}>
            {/* 看板 */}
            <rect x="2" y="2" width="20" height="14" fill="#ffffff" stroke="#202020" strokeWidth="2" />
            <text x="12" y="12" textAnchor="middle" fontSize="8" fill="#ff0000">!</text>
            {/* 柱 */}
            <rect x="10" y="16" width="4" height="16" fill="#808080" stroke="#404040" strokeWidth="1" />
          </svg>
        );
      case 'trash_can':
        return (
          <svg width="20" height="24" viewBox="0 0 20 24" style={{ imageRendering: 'pixelated' }}>
            {/* ゴミ箱 */}
            <rect x="2" y="4" width="16" height="18" fill="#404040" stroke="#202020" strokeWidth="2" rx="2" />
            {/* 蓋 */}
            <rect x="0" y="2" width="20" height="4" fill="#505050" stroke="#202020" strokeWidth="1" rx="1" />
            {/* マーク */}
            <text x="10" y="16" textAnchor="middle" fontSize="8" fill="#808080">♻</text>
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
        left: feature.position.x,
        top: feature.position.y,
        transform: 'translate(-50%, -50%)',
        zIndex: 10,
      }}
    >
      {renderFeature()}
    </div>
  );
}

export default function LocationMap() {
  const { currentLocation, agents, selectedAgentId, selectAgent, simulation } = useStore();

  const agentsInLocation = agents.filter(
    (a) => a.currentLocationId === currentLocation.id
  );

  const { timeOfDay } = simulation.gameTime;

  // 地面のパターン
  const getGroundStyle = () => {
    switch (currentLocation.type) {
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
          backgroundColor: '#c8b88c',
          backgroundImage: `
            linear-gradient(90deg, #b8a87c 1px, transparent 1px),
            linear-gradient(180deg, #b8a87c 1px, transparent 1px)
          `,
          backgroundSize: '24px 24px',
        };
      default:
        return {
          backgroundColor: '#909090',
          backgroundImage: `
            linear-gradient(90deg, #808080 2px, transparent 2px),
            linear-gradient(180deg, #808080 2px, transparent 2px)
          `,
          backgroundSize: '32px 32px',
        };
    }
  };

  // 道路
  const renderRoad = () => {
    if (currentLocation.type === 'commercial' || currentLocation.type === 'office' || currentLocation.type === 'station') {
      return (
        <div
          className="absolute left-0 right-0"
          style={{
            top: '45%',
            height: '80px',
            background: '#404040',
            borderTop: '4px solid #ffffff',
            borderBottom: '4px solid #ffffff',
          }}
        >
          {/* 中央線 */}
          <div
            className="absolute top-1/2 left-0 right-0 transform -translate-y-1/2"
            style={{
              height: '4px',
              backgroundImage: 'repeating-linear-gradient(90deg, #fff 0px, #fff 20px, transparent 20px, transparent 40px)',
            }}
          />
        </div>
      );
    }
    return null;
  };

  return (
    <div className="retro-ui relative w-full h-full overflow-hidden">
      {/* 地面 */}
      <div className="absolute inset-0" style={getGroundStyle()} />

      {/* 道路 */}
      {renderRoad()}

      {/* 時間帯オーバーレイ */}
      {timeOfDay === 'night' && (
        <div className="absolute inset-0 bg-blue-900/40 pointer-events-none z-40" />
      )}
      {timeOfDay === 'evening' && (
        <div className="absolute inset-0 bg-orange-500/20 pointer-events-none z-40" />
      )}

      {/* 建物 */}
      {currentLocation.buildings.map((building) => (
        <BuildingSprite key={building.id} building={building} />
      ))}

      {/* フィーチャー */}
      {currentLocation.features.map((feature) => (
        <FeatureSprite key={feature.id} feature={feature} />
      ))}

      {/* エージェント */}
      {agentsInLocation.map((agent) => (
        <PixelCharacter
          key={agent.id}
          agent={agent}
          isSelected={selectedAgentId === agent.id}
          onClick={() => selectAgent(selectedAgentId === agent.id ? null : agent.id)}
        />
      ))}

      {/* ロケーション名 */}
      <div className="absolute top-3 left-3 retro-box z-50">
        <div className="flex items-center gap-2">
          <span className="text-lg">
            {currentLocation.type === 'commercial' && '🏙️'}
            {currentLocation.type === 'residential' && '🏘️'}
            {currentLocation.type === 'office' && '🏢'}
            {currentLocation.type === 'park' && '🌳'}
            {currentLocation.type === 'station' && '🚉'}
          </span>
          <div>
            <div className="font-bold">{currentLocation.name}</div>
            <div className="text-xs text-gray-600">{currentLocation.description}</div>
          </div>
        </div>
      </div>

      {/* エージェント数 */}
      <div className="absolute bottom-3 left-3 retro-box-simple z-50">
        <span className="text-sm">▸ {agentsInLocation.length}にん がいる</span>
      </div>
    </div>
  );
}
