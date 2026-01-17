'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Colony, Depot, CelestialBody, Route } from '@/lib/types';
import Tooltip from './Tooltip';
import {
  calculateEllipticalPosition,
  generateEllipsePathData,
  calculateDistanceBetweenBodies,
  calculateTransportCost,
  costToHeatmapColor,
  calculateOrbitalVelocity,
  calculatePhaseDifference,
} from '@/lib/orbitalMechanics';

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
  layer: 'near' | 'far' | 'nebula'; // レイヤー分離
  color?: string; // 星の色（ネビュラ用）
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
  const [showCostHeatmap, setShowCostHeatmap] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const svgRef = useRef<SVGSVGElement>(null);

  // SVGのサイズ
  const width = 800;
  const height = 800;
  const centerX = width / 2;
  const centerY = height / 2;
  const baseScale = 60; // 1AU = 60px
  const scale = baseScale * zoomLevel;

  // ズーム・パンのイベントハンドラ
  const handleWheel = (e: React.WheelEvent<SVGSVGElement>) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1; // ズームイン/アウトの倍率
    const newZoom = Math.max(0.3, Math.min(5, zoomLevel * delta)); // 0.3倍〜5倍の範囲
    setZoomLevel(newZoom);
  };

  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    // 天体をクリックした場合はパン操作を開始しない
    if ((e.target as SVGElement).tagName !== 'svg' &&
        (e.target as SVGElement).closest('g')?.classList.contains('cursor-pointer')) {
      return;
    }

    setIsDragging(true);
    setDragStart({ x: e.clientX - panX, y: e.clientY - panY });
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!isDragging) return;

    const newPanX = e.clientX - dragStart.x;
    const newPanY = e.clientY - dragStart.y;
    setPanX(newPanX);
    setPanY(newPanY);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  // ズーム・パンのリセット
  const resetView = () => {
    setZoomLevel(1);
    setPanX(0);
    setPanY(0);
  };

  // ズームイン/アウト関数
  const zoomIn = () => {
    setZoomLevel(prev => Math.min(5, prev * 1.3));
  };

  const zoomOut = () => {
    setZoomLevel(prev => Math.max(0.3, prev / 1.3));
  };

  // パーティクル（星）を初期化 - レイヤー分離と銀河面を意識した密度分布
  useEffect(() => {
    const newParticles: Particle[] = [];

    // ネビュラレイヤー（薄いガス雲）
    const numNebula = 30;
    for (let i = 0; i < numNebula; i++) {
      const gaussianY = () => {
        let y = 0;
        for (let j = 0; j < 6; j++) {
          y += Math.random();
        }
        return (y / 6 - 0.5) * height * 0.9 + height / 2;
      };

      const y = gaussianY();
      const x = Math.random() * width;
      const colors = ['#4a5568', '#2d3748', '#1a202c', '#4c51bf', '#805ad5'];

      newParticles.push({
        x,
        y,
        size: Math.random() * 40 + 20,
        opacity: Math.random() * 0.08 + 0.02,
        twinkleSpeed: Math.random() * 0.005 + 0.002,
        layer: 'nebula',
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }

    // 遠い星レイヤー（固定、視差なし）
    const numFarStars = 120;
    for (let i = 0; i < numFarStars; i++) {
      const gaussianY = () => {
        let y = 0;
        for (let j = 0; j < 6; j++) {
          y += Math.random();
        }
        return (y / 6 - 0.5) * height * 0.8 + height / 2;
      };

      const y = gaussianY();
      const x = Math.random() * width;
      const distanceFromGalacticPlane = Math.abs(y - height / 2) / (height / 2);
      const baseOpacity = Math.max(0.15, 0.8 - distanceFromGalacticPlane * 0.6);

      newParticles.push({
        x,
        y,
        size: Math.random() * 1.2 + 0.3,
        opacity: baseOpacity * (Math.random() * 0.4 + 0.3),
        twinkleSpeed: Math.random() * 0.01 + 0.005,
        layer: 'far',
      });
    }

    // 近い星レイヤー（わずかな視差効果）
    const numNearStars = 50;
    for (let i = 0; i < numNearStars; i++) {
      const gaussianY = () => {
        let y = 0;
        for (let j = 0; j < 6; j++) {
          y += Math.random();
        }
        return (y / 6 - 0.5) * height * 0.7 + height / 2;
      };

      const y = gaussianY();
      const x = Math.random() * width;
      const distanceFromGalacticPlane = Math.abs(y - height / 2) / (height / 2);
      const baseOpacity = Math.max(0.3, 1 - distanceFromGalacticPlane * 0.5);
      const sizeVariation = 1.2 - distanceFromGalacticPlane * 0.3;

      newParticles.push({
        x,
        y,
        size: (Math.random() * 2 + 0.5) * sizeVariation,
        opacity: baseOpacity * (Math.random() * 0.6 + 0.4),
        twinkleSpeed: Math.random() * 0.03 + 0.015,
        layer: 'near',
      });
    }

    setParticles(newParticles);
  }, []);

  // 楕円軌道を考慮した位置計算
  const getBodyPosition = (body: CelestialBody) => {
    if (body.eccentricity && body.eccentricity > 0) {
      // 楕円軌道の場合
      const pos = calculateEllipticalPosition(body, body.currentAngle);
      const radians = (pos.angle * Math.PI) / 180;
      return {
        x: centerX + pos.radius * scale * Math.cos(radians),
        y: centerY + pos.radius * scale * Math.sin(radians),
        zOffset: pos.zOffset, // 2.5D表現用
      };
    } else {
      // 円軌道の場合（後方互換性）
      const radians = (body.currentAngle * Math.PI) / 180;
      return {
        x: centerX + body.orbitalRadius * scale * Math.cos(radians),
        y: centerY + body.orbitalRadius * scale * Math.sin(radians),
        zOffset: 0,
      };
    }
  };

  // 極座標から直交座標に変換（ルート描画用・後方互換）
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

  // 太陽からの照射角度を計算（惑星の満ち欠け表現用）
  const getSunAngle = (bodyX: number, bodyY: number): number => {
    // 太陽は中心にあるため、惑星から太陽へのベクトルを計算
    const dx = centerX - bodyX;
    const dy = centerY - bodyY;
    // atan2で角度を計算（度数法に変換）
    return Math.atan2(dy, dx) * 180 / Math.PI;
  };

  return (
    <div className="w-full h-full bg-slate-950 rounded-lg overflow-hidden relative">
      <svg
        ref={svgRef}
        width="100%"
        height="100%"
        viewBox={`${-panX / zoomLevel} ${-panY / zoomLevel} ${width / zoomLevel} ${height / zoomLevel}`}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
      >
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

          {/* 土星のリング */}
          <linearGradient id="saturnRingGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#D4A574" stopOpacity="0" />
            <stop offset="20%" stopColor="#F4A460" stopOpacity="0.6" />
            <stop offset="40%" stopColor="#E6C8A0" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#D4A574" stopOpacity="0.9" />
            <stop offset="60%" stopColor="#E6C8A0" stopOpacity="0.8" />
            <stop offset="80%" stopColor="#F4A460" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#D4A574" stopOpacity="0" />
          </linearGradient>

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

          {/* 位相表現用の照明グラデーション（動的生成） */}
          {[...colonies, ...depots].map(body => {
            const pos = getBodyPosition(body);
            const sunAngle = getSunAngle(pos.x, pos.y);

            // 照射方向に基づいてグラデーションの方向を設定
            const gradX1 = 50 + 50 * Math.cos((sunAngle + 180) * Math.PI / 180);
            const gradY1 = 50 + 50 * Math.sin((sunAngle + 180) * Math.PI / 180);
            const gradX2 = 50 + 50 * Math.cos(sunAngle * Math.PI / 180);
            const gradY2 = 50 + 50 * Math.sin(sunAngle * Math.PI / 180);

            return (
              <linearGradient
                key={`phase-${body.id}`}
                id={`phase-${body.id}`}
                x1={`${gradX1}%`}
                y1={`${gradY1}%`}
                x2={`${gradX2}%`}
                y2={`${gradY2}%`}
              >
                <stop offset="0%" stopColor="#000000" stopOpacity="0.7" />
                <stop offset="30%" stopColor="#000000" stopOpacity="0.4" />
                <stop offset="50%" stopColor="#000000" stopOpacity="0.1" />
                <stop offset="70%" stopColor="#ffffff" stopOpacity="0.1" />
                <stop offset="100%" stopColor="#ffffff" stopOpacity="0.3" />
              </linearGradient>
            );
          })}
        </defs>

        {/* 背景の星（レイヤー分離） */}

        {/* ネビュラレイヤー（最背面） */}
        {particles
          .filter(p => p.layer === 'nebula')
          .map((particle, i) => (
            <circle
              key={`nebula-${i}`}
              cx={particle.x}
              cy={particle.y}
              r={particle.size}
              fill={particle.color || '#4a5568'}
              opacity={particle.opacity}
            >
              <animate
                attributeName="opacity"
                values={`${particle.opacity};${particle.opacity * 0.5};${particle.opacity}`}
                dur={`${8 + Math.random() * 4}s`}
                repeatCount="indefinite"
              />
            </circle>
          ))}

        {/* 遠い星レイヤー（固定） */}
        {particles
          .filter(p => p.layer === 'far')
          .map((particle, i) => (
            <circle
              key={`far-${i}`}
              cx={particle.x}
              cy={particle.y}
              r={particle.size}
              fill="#ffffff"
              opacity={particle.opacity}
            >
              <animate
                attributeName="opacity"
                values={`${particle.opacity};${particle.opacity * 0.4};${particle.opacity}`}
                dur={`${3 + Math.random() * 2}s`}
                repeatCount="indefinite"
              />
            </circle>
          ))}

        {/* 近い星レイヤー（わずかな視差） */}
        {particles
          .filter(p => p.layer === 'near')
          .map((particle, i) => (
            <circle
              key={`near-${i}`}
              cx={particle.x}
              cy={particle.y}
              r={particle.size}
              fill="#ffffff"
              opacity={particle.opacity}
            >
              <animate
                attributeName="opacity"
                values={`${particle.opacity};${particle.opacity * 0.2};${particle.opacity}`}
                dur={`${1.5 + Math.random() * 1.5}s`}
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

        {/* 軌道の描画（楕円） */}
        {[
          { a: 0.39, e: 0.206, omega: 77 }, // 水星
          { a: 0.72, e: 0.007, omega: 131 }, // 金星
          { a: 1.0, e: 0.017, omega: 102 }, // 地球
          { a: 1.52, e: 0.093, omega: 336 }, // 火星
          { a: 2.77, e: 0.076, omega: 73 }, // ケレス（小惑星帯代表）
          { a: 5.2, e: 0.048, omega: 14 }, // 木星
          { a: 9.54, e: 0.054, omega: 93 }, // 土星
        ].map((orbit, i) => {
          const pathData = generateEllipsePathData(
            centerX,
            centerY,
            orbit.a,
            orbit.e,
            orbit.omega,
            scale
          );
          return (
            <path
              key={`orbit-${i}`}
              d={pathData}
              fill="none"
              stroke="#334155"
              strokeWidth={1}
              opacity={0.3}
            />
          );
        })}

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

        {/* デポとコロニー間の接続線（静的） - コストヒートマップ */}
        {showCostHeatmap && depots.map(depot => {
          // 全ての距離とコストを計算
          const costsForDepot = colonies.map(colony => {
            const distance = calculateDistanceBetweenBodies(
              depot,
              colony,
              depot.currentAngle,
              colony.currentAngle
            );
            return calculateTransportCost(distance);
          });

          const minCost = Math.min(...costsForDepot);
          const maxCost = Math.max(...costsForDepot);

          return colonies.map((colony, index) => {
            const depotPos = polarToCartesian(depot.orbitalRadius, depot.currentAngle);
            const colonyPos = polarToCartesian(colony.orbitalRadius, colony.currentAngle);

            const distance = calculateDistanceBetweenBodies(
              depot,
              colony,
              depot.currentAngle,
              colony.currentAngle
            );

            // 距離が近い場合のみ線を引く（3AU以内）
            if (distance > 3) return null;

            const cost = costsForDepot[index];
            const isHighlighted = hoveredId === depot.id || hoveredId === colony.id;

            // ヒートマップカラーを取得
            const heatmapColor = costToHeatmapColor(cost, minCost, maxCost);

            return (
              <g key={`connection-${depot.id}-${colony.id}`}>
                <line
                  x1={depotPos.x}
                  y1={depotPos.y}
                  x2={colonyPos.x}
                  y2={colonyPos.y}
                  stroke={isHighlighted ? "#10b981" : heatmapColor}
                  strokeWidth={isHighlighted ? 3 : 2}
                  opacity={isHighlighted ? 0.8 : 0.4}
                  strokeDasharray="4 4"
                  className="transition-all duration-300"
                  style={{ transition: 'x1 1s ease-in-out, y1 1s ease-in-out, x2 1s ease-in-out, y2 1s ease-in-out' }}
                />
                {/* コスト表示ラベル（ホバー時） */}
                {isHighlighted && (
                  <text
                    x={(depotPos.x + colonyPos.x) / 2}
                    y={(depotPos.y + colonyPos.y) / 2}
                    textAnchor="middle"
                    fill="#ffffff"
                    fontSize="10"
                    fontWeight="600"
                    className="pointer-events-none"
                    style={{ transition: 'x 1s ease-in-out, y 1s ease-in-out' }}
                  >
                    {cost}cr ({distance.toFixed(2)}AU)
                  </text>
                )}
              </g>
            );
          });
        })}

        {/* コロニーの描画 */}
        {colonies.map(colony => {
          const pos = getBodyPosition(colony);
          const size = getBodySize(colony);
          const color = getBodyColor(colony);
          const gradient = getBodyGradient(colony);
          const isSelected = selectedId === colony.id;
          const isHovered = hoveredId === colony.id;

          // 2.5D表現: Z方向のオフセットで視覚的な大きさを調整
          const zScale = 1 + pos.zOffset * 0.05; // 手前/奥で少し大きさを変える
          const visualSize = size * zScale;

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
                    style={{ transition: 'cx 1s ease-in-out, cy 1s ease-in-out' }}
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
                    style={{ transition: 'cx 1s ease-in-out, cy 1s ease-in-out' }}
                  />
                </>
              )}

              {/* コロニー本体（グロー効果付き + グラデーション + 自転アニメーション） */}
              <g filter="url(#glow)" style={{ transition: 'transform 1s ease-in-out' }}>
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={size + 2}
                  fill={gradient || color}
                  opacity={0.3}
                  style={{ transition: 'cx 1s ease-in-out, cy 1s ease-in-out' }}
                >
                  <animate
                    attributeName="r"
                    values={`${size + 1};${size + 3};${size + 1}`}
                    dur="3s"
                    repeatCount="indefinite"
                  />
                </circle>
                <g>
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={size}
                    fill={gradient || color}
                    style={{ transition: 'cx 1s ease-in-out, cy 1s ease-in-out' }}
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
                  {/* 自転効果（グラデーションの回転） */}
                  {gradient && (
                    <animateTransform
                      attributeName="transform"
                      type="rotate"
                      from={`0 ${pos.x} ${pos.y}`}
                      to={`360 ${pos.x} ${pos.y}`}
                      dur="60s"
                      repeatCount="indefinite"
                    />
                  )}
                </g>
                {/* 位相表現（満ち欠け）レイヤー */}
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={size}
                  fill={`url(#phase-${colony.id})`}
                  pointerEvents="none"
                  style={{ transition: 'cx 1s ease-in-out, cy 1s ease-in-out' }}
                />
              </g>

              {/* 土星のリング（特別処理） */}
              {colony.id === 'saturn' && (
                <ellipse
                  cx={pos.x}
                  cy={pos.y}
                  rx={size * 2.2}
                  ry={size * 0.4}
                  fill="url(#saturnRingGradient)"
                  stroke="#D4A574"
                  strokeWidth={0.5}
                  opacity={0.8}
                  pointerEvents="none"
                  style={{ transition: 'cx 1s ease-in-out, cy 1s ease-in-out' }}
                />
              )}

              {/* 満足度インジケーター */}
              {colony.satisfaction < 50 && (
                <g filter="url(#glow)">
                  <circle
                    cx={pos.x + size}
                    cy={pos.y - size}
                    r={3}
                    fill="#ef4444"
                    style={{ transition: 'cx 1s ease-in-out, cy 1s ease-in-out' }}
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
                style={{ transition: 'x 1s ease-in-out, y 1s ease-in-out' }}
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
                style={{ transition: 'x 1s ease-in-out, y 1s ease-in-out' }}
              >
                {(colony.population / 1000).toFixed(0)}K
              </text>
            </g>
          );
        })}

        {/* デポの描画 */}
        {depots.map(depot => {
          const pos = getBodyPosition(depot);
          const size = getBodySize(depot);
          const color = getBodyColor(depot);
          const isSelected = selectedId === depot.id;
          const isHovered = hoveredId === depot.id;

          // 2.5D表現
          const zScale = 1 + pos.zOffset * 0.05;
          const visualSize = size * zScale;

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
                    style={{ transition: 'cx 1s ease-in-out, cy 1s ease-in-out' }}
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
                    style={{ transition: 'cx 1s ease-in-out, cy 1s ease-in-out' }}
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
                  style={{ transition: 'x 1s ease-in-out, y 1s ease-in-out' }}
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
                  style={{ transition: 'x 1s ease-in-out, y 1s ease-in-out' }}
                >
                  <animateTransform
                    attributeName="transform"
                    type="rotate"
                    values={`0 ${pos.x} ${pos.y};360 ${pos.x} ${pos.y}`}
                    dur="20s"
                    repeatCount="indefinite"
                  />
                </rect>
                {/* 位相表現（満ち欠け）レイヤー */}
                <rect
                  x={pos.x - size / 2}
                  y={pos.y - size / 2}
                  width={size}
                  height={size}
                  fill={`url(#phase-${depot.id})`}
                  rx={2}
                  pointerEvents="none"
                  style={{ transition: 'x 1s ease-in-out, y 1s ease-in-out' }}
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
                style={{ transition: 'x 1s ease-in-out, y 1s ease-in-out' }}
              >
                {depot.nameJa}
              </text>
            </g>
          );
        })}
      </svg>

      {/* ズームコントロール */}
      <div className="absolute top-4 left-4 bg-slate-800/80 backdrop-blur-sm p-2 rounded-lg text-sm space-y-1">
        <button
          onClick={zoomIn}
          className="w-full px-3 py-2 bg-blue-500/20 hover:bg-blue-500/40 text-blue-300 rounded transition-all font-bold text-lg"
          title="ズームイン"
        >
          +
        </button>
        <button
          onClick={zoomOut}
          className="w-full px-3 py-2 bg-blue-500/20 hover:bg-blue-500/40 text-blue-300 rounded transition-all font-bold text-lg"
          title="ズームアウト"
        >
          −
        </button>
        <button
          onClick={resetView}
          className="w-full px-3 py-2 bg-slate-600/40 hover:bg-slate-600/60 text-slate-300 rounded transition-all text-xs"
          title="表示をリセット"
        >
          リセット
        </button>
        <div className="text-center text-xs text-slate-400 pt-1 border-t border-slate-600">
          {(zoomLevel * 100).toFixed(0)}%
        </div>
      </div>

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

          {/* ホバー時の数値情報 */}
          {hoveredId && (
            <div className="border-t border-slate-600 mt-2 pt-2">
              <div className="text-xs font-bold text-blue-400 mb-1">📐 軌道情報</div>
              {(() => {
                const hoveredBody = [...colonies, ...depots].find(b => b.id === hoveredId);
                if (!hoveredBody) return null;

                const velocity = calculateOrbitalVelocity(hoveredBody.orbitalRadius, hoveredBody.orbitalPeriod);
                const sunDistance = hoveredBody.orbitalRadius;

                // 地球との位相差を計算
                const earth = colonies.find(c => c.id === 'earth');
                const phaseDiff = earth ? calculatePhaseDifference(hoveredBody.currentAngle, earth.currentAngle) : 0;

                return (
                  <div className="space-y-1 text-xs font-mono">
                    <div className="flex justify-between">
                      <span className="text-slate-400">軌道半径:</span>
                      <span className="text-white font-bold">{sunDistance.toFixed(2)} AU</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">軌道速度:</span>
                      <span className="text-white font-bold">{velocity} km/s</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">公転周期:</span>
                      <span className="text-white font-bold">{hoveredBody.orbitalPeriod} 日</span>
                    </div>
                    {earth && (
                      <div className="flex justify-between">
                        <span className="text-slate-400">地球との位相差:</span>
                        <span className="text-white font-bold">{phaseDiff}°</span>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}

          <div className="border-t border-slate-600 my-2 pt-2">
            <button
              onClick={() => setShowCostHeatmap(!showCostHeatmap)}
              className={`flex items-center gap-2 w-full px-2 py-1 rounded transition-all ${
                showCostHeatmap
                  ? 'bg-blue-500/20 text-blue-300'
                  : 'bg-slate-700/50 text-slate-400'
              }`}
            >
              <span className="text-xs">📊</span>
              <span className="text-xs">コストマップ</span>
            </button>
            {showCostHeatmap && (
              <div className="mt-2 text-xs text-slate-400">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-2 bg-blue-500"></div>
                  <span>低</span>
                  <div className="w-3 h-2 bg-green-500"></div>
                  <span>中</span>
                  <div className="w-3 h-2 bg-red-500"></div>
                  <span>高</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
