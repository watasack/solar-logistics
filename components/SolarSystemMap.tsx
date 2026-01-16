'use client';

import React, { useState } from 'react';
import { Colony, Depot, CelestialBody, Route } from '@/lib/types';
import Tooltip from './Tooltip';

interface SolarSystemMapProps {
  colonies: Colony[];
  depots: Depot[];
  routes?: Route[];
  onSelectColony?: (colony: Colony) => void;
  onSelectDepot?: (depot: Depot) => void;
  onSelectLocation?: (body: CelestialBody) => void;
  selectedId?: string;
}

/**
 * 太陽系マップコンポーネント
 * 惑星、コロニー、デポを視覚的に表示
 */
export default function SolarSystemMap({
  colonies,
  depots,
  routes = [],
  onSelectColony,
  onSelectDepot,
  onSelectLocation,
  selectedId,
}: SolarSystemMapProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // SVGのサイズ
  const width = 800;
  const height = 800;
  const centerX = width / 2;
  const centerY = height / 2;
  const scale = 60; // 1AU = 60px

  // 極座標から直交座標に変換
  const polarToCartesian = (radius: number, angle: number) => {
    const radians = (angle * Math.PI) / 180;
    return {
      x: centerX + radius * scale * Math.cos(radians),
      y: centerY + radius * scale * Math.sin(radians),
    };
  };

  // 天体の色を取得
  const getBodyColor = (body: CelestialBody): string => {
    if ('population' in body) {
      // コロニー
      return '#3b82f6'; // blue
    }
    if ('depotType' in body) {
      // デポ
      return '#10b981'; // green
    }
    // 通常の天体
    switch (body.type) {
      case 'planet':
        return '#8b5cf6'; // purple
      case 'moon':
        return '#6b7280'; // gray
      case 'asteroid':
        return '#78716c'; // stone
      default:
        return '#9ca3af';
    }
  };

  // 天体のサイズを取得
  const getBodySize = (body: CelestialBody): number => {
    if ('population' in body) {
      const colony = body as Colony;
      return 4 + Math.log10(colony.population + 1);
    }
    if ('depotType' in body) {
      return 8;
    }
    return 4;
  };

  return (
    <div className="w-full h-full bg-slate-950 rounded-lg overflow-hidden relative">
      <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`}>
        {/* 太陽 - グロー効果付き */}
        <defs>
          <radialGradient id="sunGlow">
            <stop offset="0%" stopColor="#fbbf24" stopOpacity="1" />
            <stop offset="50%" stopColor="#f59e0b" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx={centerX} cy={centerY} r={30} fill="url(#sunGlow)" className="animate-pulse-slow" />
        <circle cx={centerX} cy={centerY} r={12} fill="#fbbf24" />
        <circle cx={centerX} cy={centerY} r={16} fill="#fbbf24" opacity={0.3} />

        {/* 軌道の描画 */}
        {[0.39, 0.72, 1.0, 1.52, 2.77, 5.2, 9.54].map((radius, i) => (
          <circle
            key={`orbit-${i}`}
            cx={centerX}
            cy={centerY}
            r={radius * scale}
            fill="none"
            stroke="#334155"
            strokeWidth={1}
            opacity={0.3}
          />
        ))}

        {/* アクティブな輸送ルートの描画 */}
        {routes.filter(r => r.status === 'in_transit').map(route => {
          const from = depots.find(d => d.id === route.from);
          const to = colonies.find(c => c.id === route.to);
          if (!from || !to) return null;

          const fromPos = polarToCartesian(from.orbitalRadius, from.currentAngle);
          const toPos = polarToCartesian(to.orbitalRadius, to.currentAngle);

          return (
            <g key={route.id}>
              <line
                x1={fromPos.x}
                y1={fromPos.y}
                x2={toPos.x}
                y2={toPos.y}
                stroke="#3b82f6"
                strokeWidth={2}
                opacity={0.6}
                strokeDasharray="5 5"
                className="animate-pulse"
              />
              {/* 輸送船のアニメーション */}
              <circle
                cx={fromPos.x + (toPos.x - fromPos.x) * 0.5}
                cy={fromPos.y + (toPos.y - fromPos.y) * 0.5}
                r={3}
                fill="#60a5fa"
                className="animate-pulse"
              >
                <animateMotion
                  dur="3s"
                  repeatCount="indefinite"
                  path={`M ${fromPos.x} ${fromPos.y} L ${toPos.x} ${toPos.y}`}
                />
              </circle>
            </g>
          );
        })}

        {/* デポとコロニー間の接続線（静的） */}
        {depots.map(depot => {
          return colonies.map(colony => {
            const depotPos = polarToCartesian(depot.orbitalRadius, depot.currentAngle);
            const colonyPos = polarToCartesian(colony.orbitalRadius, colony.currentAngle);

            // 距離が近い場合のみ線を引く（3AU以内）
            const dx = depot.orbitalRadius * Math.cos((depot.currentAngle * Math.PI) / 180) -
                       colony.orbitalRadius * Math.cos((colony.currentAngle * Math.PI) / 180);
            const dy = depot.orbitalRadius * Math.sin((depot.currentAngle * Math.PI) / 180) -
                       colony.orbitalRadius * Math.sin((colony.currentAngle * Math.PI) / 180);
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance > 3) return null;

            const isHighlighted = hoveredId === depot.id || hoveredId === colony.id;

            return (
              <line
                key={`connection-${depot.id}-${colony.id}`}
                x1={depotPos.x}
                y1={depotPos.y}
                x2={colonyPos.x}
                y2={colonyPos.y}
                stroke={isHighlighted ? "#10b981" : "#334155"}
                strokeWidth={isHighlighted ? 2 : 1}
                opacity={isHighlighted ? 0.6 : 0.2}
                strokeDasharray="4 4"
                className="transition-all duration-300"
              />
            );
          });
        })}

        {/* コロニーの描画 */}
        {colonies.map(colony => {
          const pos = polarToCartesian(colony.orbitalRadius, colony.currentAngle);
          const size = getBodySize(colony);
          const color = getBodyColor(colony);
          const isSelected = selectedId === colony.id;

          const isHovered = hoveredId === colony.id;

          return (
            <g
              key={colony.id}
              onClick={() => onSelectColony?.(colony)}
              onMouseEnter={() => setHoveredId(colony.id)}
              onMouseLeave={() => setHoveredId(null)}
              className="cursor-pointer transition-all duration-300"
              style={{ transform: isHovered ? 'scale(1.2)' : 'scale(1)', transformOrigin: `${pos.x}px ${pos.y}px` }}
            >
              {(isSelected || isHovered) && (
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={size + 6}
                  fill="none"
                  stroke={isSelected ? "#60a5fa" : "#3b82f6"}
                  strokeWidth={2}
                  className={isHovered ? "animate-pulse" : ""}
                />
              )}
              <circle
                cx={pos.x}
                cy={pos.y}
                r={size}
                fill={color}
                className={isHovered ? "animate-glow" : ""}
              />
              {/* 満足度インジケーター */}
              {colony.satisfaction < 50 && (
                <circle
                  cx={pos.x + size - 2}
                  cy={pos.y - size + 2}
                  r={3}
                  fill="#ef4444"
                  className="animate-pulse"
                />
              )}
              <text
                x={pos.x}
                y={pos.y - size - 4}
                textAnchor="middle"
                fill="#e2e8f0"
                fontSize="10"
                fontWeight="500"
              >
                {colony.nameJa}
              </text>
              {/* 人口表示 */}
              <text
                x={pos.x}
                y={pos.y + size + 12}
                textAnchor="middle"
                fill="#94a3b8"
                fontSize="8"
              >
                {(colony.population / 1000).toFixed(0)}K
              </text>
            </g>
          );
        })}

        {/* デポの描画 */}
        {depots.map(depot => {
          const pos = polarToCartesian(depot.orbitalRadius, depot.currentAngle);
          const size = getBodySize(depot);
          const color = getBodyColor(depot);
          const isSelected = selectedId === depot.id;
          const isHovered = hoveredId === depot.id;

          return (
            <g
              key={depot.id}
              onClick={() => onSelectDepot?.(depot)}
              onMouseEnter={() => setHoveredId(depot.id)}
              onMouseLeave={() => setHoveredId(null)}
              className="cursor-pointer transition-all duration-300"
              style={{ transform: isHovered ? 'scale(1.2)' : 'scale(1)', transformOrigin: `${pos.x}px ${pos.y}px` }}
            >
              {(isSelected || isHovered) && (
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={size + 6}
                  fill="none"
                  stroke={isSelected ? "#34d399" : "#10b981"}
                  strokeWidth={2}
                  className={isHovered ? "animate-pulse" : ""}
                />
              )}
              <rect
                x={pos.x - size / 2}
                y={pos.y - size / 2}
                width={size}
                height={size}
                fill={color}
                className={isHovered ? "animate-glow" : ""}
              />
              <text
                x={pos.x}
                y={pos.y - size - 4}
                textAnchor="middle"
                fill="#a7f3d0"
                fontSize="10"
                fontWeight="600"
              >
                {depot.nameJa}
              </text>
            </g>
          );
        })}
      </svg>

      {/* 凡例 */}
      <div className="absolute top-4 right-4 bg-slate-800/80 backdrop-blur-sm p-4 rounded-lg text-sm">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span className="text-slate-200">コロニー</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500"></div>
            <span className="text-slate-200">デポ</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-purple-500"></div>
            <span className="text-slate-200">惑星</span>
          </div>
        </div>
      </div>
    </div>
  );
}
