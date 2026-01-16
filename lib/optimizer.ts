import { CelestialBody, Colony, Depot, DistanceCalculation, DepotType } from './types';
import { depotSpecs } from './solarSystemData';

/**
 * 2つの天体間の距離を計算（余弦定理を使用）
 * @param body1 天体1
 * @param body2 天体2
 * @returns 距離計算の結果
 */
export function calculateDistance(
  body1: CelestialBody,
  body2: CelestialBody
): DistanceCalculation {
  // 余弦定理: c² = a² + b² - 2ab*cos(C)
  const r1 = body1.orbitalRadius;
  const r2 = body2.orbitalRadius;
  const angle1 = (body1.currentAngle * Math.PI) / 180;
  const angle2 = (body2.currentAngle * Math.PI) / 180;
  const angleDiff = Math.abs(angle1 - angle2);

  const distanceAU = Math.sqrt(
    r1 * r1 + r2 * r2 - 2 * r1 * r2 * Math.cos(angleDiff)
  );

  // AU をキロメートルに変換 (1 AU ≈ 149,597,870.7 km)
  const distanceKm = distanceAU * 149597870.7;

  // 移動時間の推定（簡易版）
  // 仮定: 平均速度 20,000 km/h（現実的な宇宙船速度）
  const averageSpeed = 20000; // km/h
  const travelTimeHours = distanceKm / averageSpeed;
  const travelTimeDays = travelTimeHours / 24;
  const travelTimeMonths = travelTimeDays / 30;

  // 輸送コストの計算（距離に比例 + 基本コスト）
  const baseCost = 50;
  const costPerAU = 100;
  const cost = baseCost + distanceAU * costPerAU;

  return {
    distance: distanceAU,
    distanceKm,
    travelTime: Math.max(0.1, travelTimeMonths), // 最低0.1ヶ月
    cost: Math.round(cost),
  };
}

/**
 * すべてのコロニーと候補デポ地点間の距離行列を計算
 */
export function calculateDistanceMatrix(
  colonies: Colony[],
  candidateSites: CelestialBody[]
): number[][] {
  const matrix: number[][] = [];

  for (const site of candidateSites) {
    const distances: number[] = [];
    for (const colony of colonies) {
      const calc = calculateDistance(site, colony);
      distances.push(calc.distance);
    }
    matrix.push(distances);
  }

  return matrix;
}

/**
 * 貪欲法による施設配置最適化
 * 各ステップで最も多くのコロニーをカバーできる地点を選択
 *
 * @param colonies コロニーリスト
 * @param candidateSites 候補地点リスト
 * @param maxDepots 建設可能な最大デポ数
 * @param maxDistance カバー可能な最大距離（AU）
 * @returns 選択されたデポ地点のインデックス
 */
export function greedyFacilityLocation(
  colonies: Colony[],
  candidateSites: CelestialBody[],
  maxDepots: number,
  maxDistance: number = 3.0
): number[] {
  const distanceMatrix = calculateDistanceMatrix(colonies, candidateSites);
  const selectedSites: number[] = [];
  const coveredColonies = new Set<number>();

  for (let i = 0; i < maxDepots; i++) {
    let bestSite = -1;
    let maxNewlyCovered = 0;

    // 各候補地点について、新たにカバーできるコロニー数を計算
    for (let siteIdx = 0; siteIdx < candidateSites.length; siteIdx++) {
      if (selectedSites.includes(siteIdx)) continue;

      let newlyCovered = 0;
      for (let colonyIdx = 0; colonyIdx < colonies.length; colonyIdx++) {
        if (coveredColonies.has(colonyIdx)) continue;
        if (distanceMatrix[siteIdx][colonyIdx] <= maxDistance) {
          newlyCovered++;
        }
      }

      if (newlyCovered > maxNewlyCovered) {
        maxNewlyCovered = newlyCovered;
        bestSite = siteIdx;
      }
    }

    // もうカバーできるコロニーがない場合は終了
    if (bestSite === -1 || maxNewlyCovered === 0) break;

    selectedSites.push(bestSite);

    // カバーされたコロニーを記録
    for (let colonyIdx = 0; colonyIdx < colonies.length; colonyIdx++) {
      if (distanceMatrix[bestSite][colonyIdx] <= maxDistance) {
        coveredColonies.add(colonyIdx);
      }
    }

    // すべてのコロニーがカバーされたら終了
    if (coveredColonies.size === colonies.length) break;
  }

  return selectedSites;
}

/**
 * p-メディアン問題の近似解法（交換法）
 * 総輸送コストを最小化するp個の施設を選択
 *
 * @param colonies コロニーリスト
 * @param candidateSites 候補地点リスト
 * @param p 建設するデポの数
 * @param maxIterations 最大反復回数
 * @returns 選択されたデポ地点のインデックス
 */
export function pMedianOptimization(
  colonies: Colony[],
  candidateSites: CelestialBody[],
  p: number,
  maxIterations: number = 50
): number[] {
  const distanceMatrix = calculateDistanceMatrix(colonies, candidateSites);

  // 初期解: 貪欲法で生成
  let currentSolution = greedyFacilityLocation(colonies, candidateSites, p, Infinity);
  let currentCost = calculateTotalCost(distanceMatrix, currentSolution, colonies);

  // 交換法による改善
  for (let iter = 0; iter < maxIterations; iter++) {
    let improved = false;

    for (let i = 0; i < currentSolution.length; i++) {
      for (let newSite = 0; newSite < candidateSites.length; newSite++) {
        if (currentSolution.includes(newSite)) continue;

        // 1つの施設を交換してみる
        const testSolution = [...currentSolution];
        testSolution[i] = newSite;
        const testCost = calculateTotalCost(distanceMatrix, testSolution, colonies);

        if (testCost < currentCost) {
          currentSolution = testSolution;
          currentCost = testCost;
          improved = true;
        }
      }
    }

    // 改善がなければ終了
    if (!improved) break;
  }

  return currentSolution;
}

/**
 * 総輸送コストを計算
 */
function calculateTotalCost(
  distanceMatrix: number[][],
  selectedSites: number[],
  colonies: Colony[]
): number {
  let totalCost = 0;

  for (let colonyIdx = 0; colonyIdx < colonies.length; colonyIdx++) {
    // 各コロニーに対して、最も近いデポまでの距離を使用
    let minDistance = Infinity;
    for (const siteIdx of selectedSites) {
      const distance = distanceMatrix[siteIdx][colonyIdx];
      if (distance < minDistance) {
        minDistance = distance;
      }
    }

    // コストは距離 × 需要量
    const colony = colonies[colonyIdx];
    const totalDemand =
      colony.demand.life_support +
      colony.demand.fuel +
      colony.demand.materials +
      colony.demand.equipment;

    totalCost += minDistance * totalDemand;
  }

  return totalCost;
}

/**
 * 各コロニーに最も近いデポを割り当てる
 */
export function assignColoniesToDepots(
  colonies: Colony[],
  depots: Depot[]
): Map<string, string> {
  const assignments = new Map<string, string>();

  for (const colony of colonies) {
    let nearestDepot: Depot | null = null;
    let minDistance = Infinity;

    for (const depot of depots) {
      const calc = calculateDistance(colony, depot);
      if (calc.distance < minDistance) {
        minDistance = calc.distance;
        nearestDepot = depot;
      }
    }

    if (nearestDepot) {
      assignments.set(colony.id, nearestDepot.id);
    }
  }

  return assignments;
}

/**
 * デポ配置案の評価
 */
export interface PlacementEvaluation {
  totalCost: number; // 建設コスト + 年間維持費 + 年間輸送コスト
  constructionCost: number;
  annualMaintenanceCost: number;
  annualTransportCost: number;
  coverageRate: number; // カバー率（%）
  avgDistance: number; // 平均配送距離（AU）
  maxDistance: number; // 最大配送距離（AU）
}

/**
 * デポ配置を評価
 */
export function evaluatePlacement(
  colonies: Colony[],
  depots: Depot[]
): PlacementEvaluation {
  let constructionCost = 0;
  let annualMaintenanceCost = 0;
  let totalDistance = 0;
  let maxDistance = 0;
  let coveredCount = 0;

  // デポのコスト計算
  for (const depot of depots) {
    constructionCost += depot.constructionCost;
    annualMaintenanceCost += depot.maintenanceCost * 12; // 月→年
  }

  // 各コロニーについて最寄りのデポまでの距離を計算
  for (const colony of colonies) {
    let minDist = Infinity;

    for (const depot of depots) {
      const calc = calculateDistance(colony, depot);
      if (calc.distance < minDist) {
        minDist = calc.distance;
      }
    }

    if (minDist < Infinity) {
      totalDistance += minDist;
      maxDistance = Math.max(maxDistance, minDist);
      coveredCount++;
    }
  }

  const avgDistance = colonies.length > 0 ? totalDistance / colonies.length : 0;
  const coverageRate = colonies.length > 0 ? (coveredCount / colonies.length) * 100 : 0;

  // 年間輸送コスト（距離 × 需要 × 回数）
  let annualTransportCost = 0;
  for (const colony of colonies) {
    const totalDemand =
      colony.demand.life_support +
      colony.demand.fuel +
      colony.demand.materials +
      colony.demand.equipment;

    // 最寄りのデポまでの距離を取得
    let minDist = Infinity;
    for (const depot of depots) {
      const calc = calculateDistance(colony, depot);
      if (calc.distance < minDist) {
        minDist = calc.distance;
      }
    }

    // コスト = 距離 × 需要量 × 12ヶ月
    annualTransportCost += minDist * totalDemand * 12 * 10; // ×10は単位調整
  }

  const totalCost = constructionCost + annualMaintenanceCost + annualTransportCost;

  return {
    totalCost: Math.round(totalCost),
    constructionCost: Math.round(constructionCost),
    annualMaintenanceCost: Math.round(annualMaintenanceCost),
    annualTransportCost: Math.round(annualTransportCost),
    coverageRate: Math.round(coverageRate * 10) / 10,
    avgDistance: Math.round(avgDistance * 100) / 100,
    maxDistance: Math.round(maxDistance * 100) / 100,
  };
}

/**
 * 推奨されるデポ配置を生成
 */
export function generateRecommendedPlacement(
  colonies: Colony[],
  candidateSites: CelestialBody[],
  budget: number,
  depotType: DepotType = 'standard'
): { sites: CelestialBody[]; evaluation: PlacementEvaluation } {
  const spec = depotSpecs[depotType];

  // 予算で建設可能な最大数を計算
  const maxDepots = Math.floor(budget / spec.constructionCost);

  // 最適化アルゴリズムで地点を選択
  const selectedIndices = pMedianOptimization(colonies, candidateSites, Math.min(maxDepots, 5));
  const selectedSites = selectedIndices.map(idx => candidateSites[idx]);

  // デポオブジェクトを作成
  const depots: Depot[] = selectedSites.map((site, index) => ({
    ...site,
    depotType,
    constructionCost: spec.constructionCost,
    maintenanceCost: spec.maintenanceCost,
    capacity: spec.capacity,
    currentStock: 0,
    specialAbility: spec.specialAbility,
  }));

  // 評価
  const evaluation = evaluatePlacement(colonies, depots);

  return { sites: selectedSites, evaluation };
}
