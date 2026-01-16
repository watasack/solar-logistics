'use client';

import React from 'react';
import { Colony, Depot, CelestialBody } from '@/lib/types';

interface SolarSystemMapProps {
  colonies: Colony[];
  depots: Depot[];
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
  onSelectColony,
  onSelectDepot,
  onSelectLocation,
  selectedId,
}: SolarSystemMapProps) {
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
        {/* 太陽 */}
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

        {/* デポとコロニー間の接続線 */}
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

            return (
              <line
                key={`connection-${depot.id}-${colony.id}`}
                x1={depotPos.x}
                y1={depotPos.y}
                x2={colonyPos.x}
                y2={colonyPos.y}
                stroke="#10b981"
                strokeWidth={1}
                opacity={0.2}
                strokeDasharray="4 4"
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

          return (
            <g
              key={colony.id}
              onClick={() => onSelectColony?.(colony)}
              className="cursor-pointer transition-transform hover:scale-110"
            >
              {isSelected && (
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={size + 4}
                  fill="none"
                  stroke="#60a5fa"
                  strokeWidth={2}
                />
              )}
              <circle cx={pos.x} cy={pos.y} r={size} fill={color} />
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

          return (
            <g
              key={depot.id}
              onClick={() => onSelectDepot?.(depot)}
              className="cursor-pointer transition-transform hover:scale-110"
            >
              {isSelected && (
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={size + 4}
                  fill="none"
                  stroke="#34d399"
                  strokeWidth={2}
                />
              )}
              <rect
                x={pos.x - size / 2}
                y={pos.y - size / 2}
                width={size}
                height={size}
                fill={color}
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
