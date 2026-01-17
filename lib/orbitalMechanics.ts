/**
 * 軌道力学の計算ユーティリティ
 * 楕円軌道の位置計算、非等速運動などを扱う
 */

import { CelestialBody } from './types';

/**
 * 楕円軌道上の位置を計算
 * @param body 天体
 * @param meanAnomaly 平均近点角（度）
 * @returns 極座標 {radius, angle}
 */
export function calculateEllipticalPosition(
  body: CelestialBody,
  meanAnomaly: number
): { radius: number; angle: number; zOffset: number } {
  const a = body.orbitalRadius; // 半長軸
  const e = body.eccentricity || 0; // 離心率
  const omega = (body.longitudeOfPerihelion || 0) * Math.PI / 180; // 近日点黄経（ラジアン）
  const i = (body.inclination || 0) * Math.PI / 180; // 軌道傾斜角（ラジアン）

  // 平均近点角をラジアンに変換
  const M = meanAnomaly * Math.PI / 180;

  // 離心近点角を求める（ケプラー方程式を簡易的に解く）
  const E = solveKeplerEquation(M, e);

  // 真近点角を求める
  const nu = 2 * Math.atan2(
    Math.sqrt(1 + e) * Math.sin(E / 2),
    Math.sqrt(1 - e) * Math.cos(E / 2)
  );

  // 軌道半径を計算
  const r = a * (1 - e * Math.cos(E));

  // 軌道面内の角度
  const theta = nu + omega;

  // 2.5D表現：軌道傾斜によるZ方向オフセット
  // 簡略化: sin(傾斜角) * 軌道半径 * sin(軌道位置)
  const zOffset = Math.sin(i) * r * Math.sin(nu);

  return {
    radius: r,
    angle: theta * 180 / Math.PI, // 度に変換
    zOffset, // Z方向オフセット（視覚効果用）
  };
}

/**
 * ケプラー方程式を数値的に解く（ニュートン法）
 * M = E - e * sin(E)
 */
function solveKeplerEquation(M: number, e: number, tolerance = 1e-6): number {
  let E = M; // 初期値
  let delta = 1;
  let iterations = 0;
  const maxIterations = 20;

  while (Math.abs(delta) > tolerance && iterations < maxIterations) {
    delta = (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
    E -= delta;
    iterations++;
  }

  return E;
}

/**
 * 平均運動（日あたりの角度変化）を計算
 */
export function getMeanMotion(orbitalPeriod: number): number {
  return 360 / orbitalPeriod; // 度/日
}

/**
 * ターン経過後の平均近点角を計算
 * @param currentAngle 現在の平均近点角
 * @param orbitalPeriod 公転周期（日）
 * @param days 経過日数
 */
export function advanceMeanAnomaly(
  currentAngle: number,
  orbitalPeriod: number,
  days: number
): number {
  const meanMotion = getMeanMotion(orbitalPeriod);
  return (currentAngle + meanMotion * days) % 360;
}

/**
 * 楕円軌道パスを生成（SVG用）
 */
export function generateEllipsePathData(
  centerX: number,
  centerY: number,
  semiMajorAxis: number,
  eccentricity: number,
  longitudeOfPerihelion: number,
  scale: number
): string {
  const a = semiMajorAxis * scale;
  const b = a * Math.sqrt(1 - eccentricity * eccentricity); // 半短軸
  const c = a * eccentricity; // 焦点距離

  // 楕円の中心オフセット（太陽が焦点の一つにある）
  const omega = longitudeOfPerihelion * Math.PI / 180;
  const offsetX = -c * Math.cos(omega);
  const offsetY = -c * Math.sin(omega);

  // SVG楕円パス（回転考慮）
  const cx = centerX + offsetX;
  const cy = centerY + offsetY;
  const rotation = longitudeOfPerihelion;

  return `M ${cx - a} ${cy}
          A ${a} ${b} ${rotation} 0 1 ${cx + a} ${cy}
          A ${a} ${b} ${rotation} 0 1 ${cx - a} ${cy}`;
}

/**
 * 2つの天体間の距離を計算（楕円軌道考慮）
 */
export function calculateDistanceBetweenBodies(
  body1: CelestialBody,
  body2: CelestialBody,
  meanAnomaly1: number,
  meanAnomaly2: number
): number {
  const pos1 = calculateEllipticalPosition(body1, meanAnomaly1);
  const pos2 = calculateEllipticalPosition(body2, meanAnomaly2);

  // 極座標から直交座標に変換
  const angle1 = pos1.angle * Math.PI / 180;
  const angle2 = pos2.angle * Math.PI / 180;

  const x1 = pos1.radius * Math.cos(angle1);
  const y1 = pos1.radius * Math.sin(angle1);
  const x2 = pos2.radius * Math.cos(angle2);
  const y2 = pos2.radius * Math.sin(angle2);

  // 2D距離（AU）
  const distance2D = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);

  // Z方向の差を考慮（3D距離）
  const dz = pos2.zOffset - pos1.zOffset;
  const distance3D = Math.sqrt(distance2D ** 2 + dz ** 2);

  return distance3D;
}
