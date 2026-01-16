'use client';

import React, { useState, useEffect, useRef } from 'react';
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

// パーティクル（背景の星）
interface Particle {
  x: number;
  y: number;
  size: number;
  opacity: number;
  twinkleSpeed: number;
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
  const [particles, setParticles] = useState<Particle[]>([]);

  // SVGのサイズ
  const width = 800;
  const height = 800;
  const centerX = width / 2;
  const centerY = height / 2;
  const scale = 60; // 1AU = 60px

  // パーティクル（星）を初期化
  useEffect(() => {
    const newParticles: Particle[] = [];
    for (let i = 0; i < 100; i++) {
      newParticles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 2 + 0.5,
        opacity: Math.random() * 0.7 + 0.3,
        twinkleSpeed: Math.random() * 0.02 + 0.01,
      });
    }
    setParticles(newParticles);
  }, []);

  // 極座標から直交座標に変換
  const polarToCartesian = (radius: number, angle: number) => {
    const radians = (angle * Math.PI) / 180;
    return {
      x: centerX + radius * scale * Math.cos(radians),
      y: centerY + radius * scale * Math.sin(radians),
    };
  };

  // 天体の色を取得（実際の惑星の色に近づける）
  const getBodyColor = (body: CelestialBody): string => {
    if ('population' in body) {
      // コロニーは元の青を維持
      return '#3b82f6'; // blue
    }
    if ('depotType' in body) {
      // デポは元の緑を維持
      return '#10b981'; // green
    }

    // 惑星・衛星ごとの固有色（実際の色に基づく）
    const bodyColors: { [key: string]: string } = {
      'mercury': '#8C7853',   // 水星: 灰色がかった茶色
      'venus': '#FFC649',     // 金星: 黄金色（厚い雲）
      'earth': '#4169E1',     // 地球: 青（海洋）
      'moon': '#C0C0C0',      // 月: 銀灰色
      'mars': '#CD5C5C',      // 火星: 赤褐色
      'phobos': '#8B7355',    // フォボス: 暗い茶色
      'ceres': '#B8860B',     // ケレス: 暗い金色
      'vesta': '#A0826D',     // ベスタ: 灰茶色
      'jupiter': '#C88B3A',   // 木星: オレンジ茶色（大赤斑）
      'io': '#FFD700',        // イオ: 黄色（硫黄）
      'europa': '#B0C4DE',    // エウロパ: 薄い青（氷）
      'ganymede': '#8B7D6B',  // ガニメデ: 暗い茶色
      'callisto': '#696969',  // カリスト: 暗い灰色
      'saturn': '#F4A460',    // 土星: サンディブラウン
      'titan': '#FFA500',     // タイタン: オレンジ（厚い大気）
      'enceladus': '#E6F3FF', // エンケラドゥス: 青白（氷）
    };

    if (bodyColors[body.id]) {
      return bodyColors[body.id];
    }

    // フォールバック（デフォルトの色）
    switch (body.type) {
      case 'planet':
        return '#8b5cf6'; // purple
      case 'moon':
        return '#9ca3af'; // gray
      case 'asteroid':
        return '#78716c'; // stone
      default:
        return '#9ca3af';
    }
  };

  // 惑星固有のグラデーションを取得
  const getBodyGradient = (body: CelestialBody): string | null => {
    const gradientMap: { [key: string]: string } = {
      'earth': 'url(#earthGradient)',
      'mars': 'url(#marsGradient)',
      'jupiter': 'url(#jupiterStripes)',
      'venus': 'url(#venusGradient)',
      'saturn': 'url(#saturnGradient)',
      'europa': 'url(#europaGradient)',
      'io': 'url(#ioGradient)',
      'titan': 'url(#titanGradient)',
      'moon': 'url(#moonGradient)',
      'mercury': 'url(#mercuryGradient)',
    };

    return gradientMap[body.id] || null;
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
        <defs>
          {/* 太陽のグラデーション */}
          <radialGradient id="sunGlow">
            <stop offset="0%" stopColor="#fbbf24" stopOpacity="1" />
            <stop offset="50%" stopColor="#f59e0b" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="sunCore">
            <stop offset="0%" stopColor="#fef3c7" stopOpacity="1" />
            <stop offset="50%" stopColor="#fbbf24" stopOpacity="1" />
            <stop offset="100%" stopColor="#f59e0b" stopOpacity="1" />
          </radialGradient>
          {/* フィルター：グロー効果 */}
          <filter id="glow">
            <feGaussianBlur stdDeviation="3.5" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          {/* フィルター：強いグロー効果 */}
          <filter id="strongGlow">
            <feGaussianBlur stdDeviation="5" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>

          {/* 惑星固有のグラデーション */}

          {/* 地球: 青い海と緑の陸地 */}
          <radialGradient id="earthGradient">
            <stop offset="0%" stopColor="#1e40af" />
            <stop offset="50%" stopColor="#3b82f6" />
            <stop offset="80%" stopColor="#22c55e" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#1e3a8a" />
          </radialGradient>

          {/* 火星: 赤褐色の大地 */}
          <radialGradient id="marsGradient">
            <stop offset="0%" stopColor="#dc2626" />
            <stop offset="50%" stopColor="#CD5C5C" />
            <stop offset="100%" stopColor="#7f1d1d" />
          </radialGradient>

          {/* 木星: 縞模様 */}
          <linearGradient id="jupiterStripes" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#f59e0b" />
            <stop offset="20%" stopColor="#C88B3A" />
            <stop offset="40%" stopColor="#ea580c" />
            <stop offset="60%" stopColor="#C88B3A" />
            <stop offset="80%" stopColor="#d97706" />
            <stop offset="100%" stopColor="#92400e" />
          </linearGradient>

          {/* 金星: 厚い黄色い雲 */}
          <radialGradient id="venusGradient">
            <stop offset="0%" stopColor="#fef3c7" />
            <stop offset="50%" stopColor="#FFC649" />
            <stop offset="100%" stopColor="#f59e0b" />
          </radialGradient>

          {/* 土星: 淡いオレンジ色 */}
          <radialGradient id="saturnGradient">
            <stop offset="0%" stopColor="#fde68a" />
            <stop offset="50%" stopColor="#F4A460" />
            <stop offset="100%" stopColor="#d97706" />
          </radialGradient>

          {/* エウロパ: 氷の表面 */}
          <radialGradient id="europaGradient">
            <stop offset="0%" stopColor="#e0f2fe" />
            <stop offset="50%" stopColor="#B0C4DE" />
            <stop offset="100%" stopColor="#7dd3fc" />
          </radialGradient>

          {/* イオ: 硫黄の黄色 */}
          <radialGradient id="ioGradient">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="50%" stopColor="#FFD700" />
            <stop offset="100%" stopColor="#ca8a04" />
          </radialGradient>

          {/* タイタン: オレンジの大気 */}
          <radialGradient id="titanGradient">
            <stop offset="0%" stopColor="#fed7aa" />
            <stop offset="50%" stopColor="#FFA500" />
            <stop offset="100%" stopColor="#c2410c" />
          </radialGradient>

          {/* 月: グレーのクレーター */}
          <radialGradient id="moonGradient">
            <stop offset="0%" stopColor="#e5e7eb" />
            <stop offset="50%" stopColor="#C0C0C0" />
            <stop offset="100%" stopColor="#6b7280" />
          </radialGradient>

          {/* 水星: 灰茶色 */}
          <radialGradient id="mercuryGradient">
            <stop offset="0%" stopColor="#a8a29e" />
            <stop offset="50%" stopColor="#8C7853" />
            <stop offset="100%" stopColor="#57534e" />
          </radialGradient>
        </defs>

        {/* 背景の星（パーティクル） */}
        {particles.map((particle, i) => (
          <circle
            key={`particle-${i}`}
            cx={particle.x}
            cy={particle.y}
            r={particle.size}
            fill="#ffffff"
            opacity={particle.opacity}
          >
            <animate
              attributeName="opacity"
              values={`${particle.opacity};${particle.opacity * 0.3};${particle.opacity}`}
              dur={`${2 + Math.random() * 3}s`}
              repeatCount="indefinite"
            />
          </circle>
        ))}

        {/* 太陽 - 強化されたグロー効果 */}
        <g filter="url(#strongGlow)">
          <circle cx={centerX} cy={centerY} r={50} fill="url(#sunGlow)" opacity="0.4">
            <animate attributeName="r" values="45;55;45" dur="4s" repeatCount="indefinite" />
          </circle>
          <circle cx={centerX} cy={centerY} r={30} fill="url(#sunGlow)" opacity="0.6">
            <animate attributeName="r" values="28;32;28" dur="3s" repeatCount="indefinite" />
          </circle>
          <circle cx={centerX} cy={centerY} r={15} fill="url(#sunCore)">
            <animate attributeName="r" values="14;16;14" dur="2s" repeatCount="indefinite" />
          </circle>
        </g>

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
        {routes.filter(r => r.status === 'in_transit').map((route, idx) => {
          const from = depots.find(d => d.id === route.from);
          const to = colonies.find(c => c.id === route.to);
          if (!from || !to) return null;

          const fromPos = polarToCartesian(from.orbitalRadius, from.currentAngle);
          const toPos = polarToCartesian(to.orbitalRadius, to.currentAngle);

          // 曲線パスを計算（ベジェ曲線）
          const midX = (fromPos.x + toPos.x) / 2;
          const midY = (fromPos.y + toPos.y) / 2;
          const dx = toPos.x - fromPos.x;
          const dy = toPos.y - fromPos.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const curvature = distance * 0.2;

          // 曲線の制御点（軌道に沿うような曲線）
          const controlX = midX - dy * curvature / distance;
          const controlY = midY + dx * curvature / distance;

          const pathId = `route-${route.id}`;
          const curvePath = `M ${fromPos.x} ${fromPos.y} Q ${controlX} ${controlY} ${toPos.x} ${toPos.y}`;

          return (
            <g key={route.id} filter="url(#glow)">
              {/* 航路の軌跡（グラデーション） */}
              <defs>
                <linearGradient id={`grad-${route.id}`} x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
                  <stop offset="50%" stopColor="#60a5fa" stopOpacity="0.6" />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.3" />
                </linearGradient>
              </defs>

              <path
                id={pathId}
                d={curvePath}
                stroke={`url(#grad-${route.id})`}
                strokeWidth={2}
                fill="none"
                opacity={0.8}
              >
                <animate
                  attributeName="stroke-dasharray"
                  values="0,1000;1000,0"
                  dur="2s"
                  repeatCount="indefinite"
                />
              </path>

              {/* 輸送船本体 */}
              <g filter="url(#glow)">
                <circle r={4} fill="#60a5fa">
                  <animateMotion
                    dur={`${3 + idx * 0.5}s`}
                    repeatCount="indefinite"
                    path={curvePath}
                  />
                </circle>
                {/* 輸送船の光の軌跡 */}
                <circle r={2} fill="#93c5fd" opacity="0.6">
                  <animateMotion
                    dur={`${3 + idx * 0.5}s`}
                    repeatCount="indefinite"
                    path={curvePath}
                    begin="0.1s"
                  />
                </circle>
                <circle r={1.5} fill="#dbeafe" opacity="0.4">
                  <animateMotion
                    dur={`${3 + idx * 0.5}s`}
                    repeatCount="indefinite"
                    path={curvePath}
                    begin="0.2s"
                  />
                </circle>
              </g>
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
          const gradient = getBodyGradient(colony);
          const isSelected = selectedId === colony.id;
          const isHovered = hoveredId === colony.id;

          return (
            <g
              key={colony.id}
              onClick={() => onSelectColony?.(colony)}
              onMouseEnter={() => setHoveredId(colony.id)}
              onMouseLeave={() => setHoveredId(null)}
              className="cursor-pointer transition-all duration-300"
            >
              {/* 選択時の外側の輪 */}
              {(isSelected || isHovered) && (
                <>
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={size + 8}
                    fill="none"
                    stroke={isSelected ? "#60a5fa" : "#3b82f6"}
                    strokeWidth={2}
                    opacity={0.6}
                  >
                    <animate
                      attributeName="r"
                      values={`${size + 6};${size + 10};${size + 6}`}
                      dur="2s"
                      repeatCount="indefinite"
                    />
                    <animate
                      attributeName="opacity"
                      values="0.6;0.3;0.6"
                      dur="2s"
                      repeatCount="indefinite"
                    />
                  </circle>
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={size + 4}
                    fill="none"
                    stroke={isSelected ? "#60a5fa" : "#3b82f6"}
                    strokeWidth={1}
                    opacity={0.8}
                  />
                </>
              )}

              {/* コロニー本体（グロー効果付き + グラデーション） */}
              <g filter="url(#glow)">
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={size + 2}
                  fill={gradient || color}
                  opacity={0.3}
                >
                  <animate
                    attributeName="r"
                    values={`${size + 1};${size + 3};${size + 1}`}
                    dur="3s"
                    repeatCount="indefinite"
                  />
                </circle>
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={size}
                  fill={gradient || color}
                >
                  {isHovered && (
                    <animate
                      attributeName="r"
                      values={`${size};${size * 1.2};${size}`}
                      dur="0.5s"
                      repeatCount="1"
                    />
                  )}
                </circle>
              </g>

              {/* 満足度インジケーター */}
              {colony.satisfaction < 50 && (
                <g filter="url(#glow)">
                  <circle
                    cx={pos.x + size}
                    cy={pos.y - size}
                    r={3}
                    fill="#ef4444"
                  >
                    <animate
                      attributeName="opacity"
                      values="1;0.3;1"
                      dur="1s"
                      repeatCount="indefinite"
                    />
                  </circle>
                </g>
              )}

              <text
                x={pos.x}
                y={pos.y - size - 6}
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
                y={pos.y + size + 14}
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
            >
              {/* 選択時の外側の輪 */}
              {(isSelected || isHovered) && (
                <>
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={size + 8}
                    fill="none"
                    stroke={isSelected ? "#34d399" : "#10b981"}
                    strokeWidth={2}
                    opacity={0.6}
                  >
                    <animate
                      attributeName="r"
                      values={`${size + 6};${size + 10};${size + 6}`}
                      dur="2s"
                      repeatCount="indefinite"
                    />
                    <animate
                      attributeName="opacity"
                      values="0.6;0.3;0.6"
                      dur="2s"
                      repeatCount="indefinite"
                    />
                  </circle>
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={size + 4}
                    fill="none"
                    stroke={isSelected ? "#34d399" : "#10b981"}
                    strokeWidth={1}
                    opacity={0.8}
                  />
                </>
              )}

              {/* デポ本体（グロー効果付き） */}
              <g filter="url(#glow)">
                {/* 外側のグロー */}
                <rect
                  x={pos.x - (size + 2) / 2}
                  y={pos.y - (size + 2) / 2}
                  width={size + 2}
                  height={size + 2}
                  fill={color}
                  opacity={0.3}
                  rx={2}
                >
                  <animate
                    attributeName="width"
                    values={`${size + 1};${size + 4};${size + 1}`}
                    dur="3s"
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="height"
                    values={`${size + 1};${size + 4};${size + 1}`}
                    dur="3s"
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="x"
                    values={`${pos.x - (size + 1) / 2};${pos.x - (size + 4) / 2};${pos.x - (size + 1) / 2}`}
                    dur="3s"
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="y"
                    values={`${pos.y - (size + 1) / 2};${pos.y - (size + 4) / 2};${pos.y - (size + 1) / 2}`}
                    dur="3s"
                    repeatCount="indefinite"
                  />
                </rect>
                {/* 本体 */}
                <rect
                  x={pos.x - size / 2}
                  y={pos.y - size / 2}
                  width={size}
                  height={size}
                  fill={color}
                  rx={2}
                >
                  <animateTransform
                    attributeName="transform"
                    type="rotate"
                    values={`0 ${pos.x} ${pos.y};360 ${pos.x} ${pos.y}`}
                    dur="20s"
                    repeatCount="indefinite"
                  />
                </rect>
              </g>

              <text
                x={pos.x}
                y={pos.y - size - 6}
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
