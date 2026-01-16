import { GameState, Colony, Depot, Route } from './types';
import { initialColonies } from './solarSystemData';
import { calculateDistance } from './optimizer';

/**
 * 新しいゲームを初期化
 */
export function initializeGame(): GameState {
  return {
    currentTurn: 0,
    year: 2150,
    month: 1,
    budget: 10000,
    income: 0,
    expenses: 0,
    colonies: JSON.parse(JSON.stringify(initialColonies)), // Deep copy
    depots: [],
    routes: [],
    score: {
      deliveryRate: 100,
      costEfficiency: 100,
      avgDeliveryTime: 0,
      customerSatisfaction: 70,
      totalScore: 85,
    },
  };
}

/**
 * ターンを進める
 */
export function advanceTurn(state: GameState): GameState {
  const newState = JSON.parse(JSON.stringify(state)) as GameState;

  // ターン数を進める
  newState.currentTurn++;
  newState.month++;
  if (newState.month > 12) {
    newState.month = 1;
    newState.year++;
  }

  // 惑星の位置を更新（公転）
  updateOrbitalPositions(newState);

  // 在庫を消費（需要分を減らす）
  consumeInventory(newState);

  // 輸送中のルートを処理
  processRoutes(newState);

  // 収支を計算
  calculateFinances(newState);

  // 満足度を更新
  updateSatisfaction(newState);

  // スコアを計算
  calculateScore(newState);

  return newState;
}

/**
 * 惑星の軌道位置を更新
 */
function updateOrbitalPositions(state: GameState): void {
  const updateBody = (body: { orbitalPeriod: number; currentAngle: number }) => {
    // 1ヶ月（30日）進む
    const days = 30;
    const anglePerDay = 360 / body.orbitalPeriod;
    body.currentAngle = (body.currentAngle + anglePerDay * days) % 360;
  };

  state.colonies.forEach(updateBody);
  state.depots.forEach(updateBody);
}

/**
 * コロニーの在庫を消費
 */
function consumeInventory(state: GameState): void {
  for (const colony of state.colonies) {
    colony.inventory.life_support -= colony.demand.life_support;
    colony.inventory.fuel -= colony.demand.fuel;
    colony.inventory.materials -= colony.demand.materials;
    colony.inventory.equipment -= colony.demand.equipment;

    // 在庫がマイナスにならないように
    colony.inventory.life_support = Math.max(0, colony.inventory.life_support);
    colony.inventory.fuel = Math.max(0, colony.inventory.fuel);
    colony.inventory.materials = Math.max(0, colony.inventory.materials);
    colony.inventory.equipment = Math.max(0, colony.inventory.equipment);
  }
}

/**
 * 輸送ルートを処理
 */
function processRoutes(state: GameState): void {
  const completedRoutes: string[] = [];

  for (const route of state.routes) {
    if (route.status === 'in_transit') {
      route.duration--;

      if (route.duration <= 0) {
        // 配送完了
        route.status = 'delivered';
        completedRoutes.push(route.id);

        // コロニーの在庫に追加
        const colony = state.colonies.find(c => c.id === route.to);
        if (colony) {
          colony.inventory.life_support += route.cargo.life_support;
          colony.inventory.fuel += route.cargo.fuel;
          colony.inventory.materials += route.cargo.materials;
          colony.inventory.equipment += route.cargo.equipment;
        }
      }
    }
  }

  // 配送完了したルートを削除
  state.routes = state.routes.filter(r => !completedRoutes.includes(r.id));
}

/**
 * 収支を計算
 */
function calculateFinances(state: GameState): void {
  // 支出: デポの維持費
  let maintenanceCost = 0;
  for (const depot of state.depots) {
    maintenanceCost += depot.maintenanceCost;
  }

  // 支出: 輸送コスト
  let transportCost = 0;
  for (const route of state.routes) {
    if (route.status === 'delivered') {
      transportCost += route.cost;
    }
  }

  // 収入: コロニーからの支払い（満足度に応じて）
  let revenue = 0;
  for (const colony of state.colonies) {
    const baseRevenue = colony.population * 0.01; // 人口ベースの基本収入
    const satisfactionMultiplier = colony.satisfaction / 100;
    revenue += baseRevenue * satisfactionMultiplier;
  }

  state.expenses = maintenanceCost + transportCost;
  state.income = revenue;
  state.budget += state.income - state.expenses;
}

/**
 * コロニーの満足度を更新
 */
function updateSatisfaction(state: GameState): void {
  for (const colony of state.colonies) {
    // 在庫充足率を計算
    const lifeSupportRatio = colony.inventory.life_support / (colony.demand.life_support * 2);
    const fuelRatio = colony.inventory.fuel / (colony.demand.fuel * 2);
    const materialsRatio = colony.inventory.materials / (colony.demand.materials * 2);
    const equipmentRatio = colony.inventory.equipment / (colony.demand.equipment * 2);

    // 平均充足率
    const avgRatio = (lifeSupportRatio + fuelRatio + materialsRatio + equipmentRatio) / 4;

    // 満足度を調整
    if (avgRatio < 0.3) {
      colony.satisfaction = Math.max(0, colony.satisfaction - 10);
    } else if (avgRatio < 0.5) {
      colony.satisfaction = Math.max(0, colony.satisfaction - 5);
    } else if (avgRatio > 1.5) {
      colony.satisfaction = Math.min(100, colony.satisfaction + 5);
    } else if (avgRatio > 1.0) {
      colony.satisfaction = Math.min(100, colony.satisfaction + 2);
    }
  }
}

/**
 * スコアを計算
 */
function calculateScore(state: GameState): void {
  // 配送達成率
  let totalDemand = 0;
  let metDemand = 0;

  for (const colony of state.colonies) {
    const demand =
      colony.demand.life_support +
      colony.demand.fuel +
      colony.demand.materials +
      colony.demand.equipment;

    const inventory =
      colony.inventory.life_support +
      colony.inventory.fuel +
      colony.inventory.materials +
      colony.inventory.equipment;

    totalDemand += demand;
    metDemand += Math.min(inventory, demand);
  }

  const deliveryRate = totalDemand > 0 ? (metDemand / totalDemand) * 100 : 100;

  // コスト効率（予算の健全性）
  const costEfficiency = state.budget > 0 ? Math.min(100, (state.budget / 10000) * 100) : 0;

  // 顧客満足度
  const avgSatisfaction =
    state.colonies.reduce((sum, c) => sum + c.satisfaction, 0) / state.colonies.length;

  // 総合スコア
  const totalScore = (deliveryRate * 0.4 + costEfficiency * 0.3 + avgSatisfaction * 0.3);

  state.score = {
    deliveryRate: Math.round(deliveryRate * 10) / 10,
    costEfficiency: Math.round(costEfficiency * 10) / 10,
    avgDeliveryTime: 0, // TODO: 実装
    customerSatisfaction: Math.round(avgSatisfaction * 10) / 10,
    totalScore: Math.round(totalScore * 10) / 10,
  };
}

/**
 * デポを建設
 */
export function buildDepot(state: GameState, depot: Depot): GameState {
  const newState = JSON.parse(JSON.stringify(state)) as GameState;

  // 予算チェック
  if (newState.budget < depot.constructionCost) {
    throw new Error('予算不足です');
  }

  // 予算を消費
  newState.budget -= depot.constructionCost;

  // デポを追加
  newState.depots.push(depot);

  return newState;
}

/**
 * 輸送ルートを作成
 */
export function createRoute(
  state: GameState,
  depotId: string,
  colonyId: string,
  cargo: Route['cargo']
): GameState {
  const newState = JSON.parse(JSON.stringify(state)) as GameState;

  const depot = newState.depots.find(d => d.id === depotId);
  const colony = newState.colonies.find(c => c.id === colonyId);

  if (!depot || !colony) {
    throw new Error('デポまたはコロニーが見つかりません');
  }

  // 距離とコストを計算
  const calc = calculateDistance(depot, colony);

  // ルートを作成
  const route: Route = {
    id: `route_${Date.now()}_${Math.random()}`,
    from: depotId,
    to: colonyId,
    cargo,
    cost: calc.cost,
    duration: Math.ceil(calc.travelTime),
    status: 'in_transit',
  };

  newState.routes.push(route);

  return newState;
}

/**
 * 自動補給を実行（簡易AI）
 * 在庫が不足しているコロニーに自動で物資を送る
 */
export function autoSupply(state: GameState): GameState {
  let newState = JSON.parse(JSON.stringify(state)) as GameState;

  for (const colony of newState.colonies) {
    // 在庫が需要の1ヶ月分以下の場合に補給
    const needsSupply =
      colony.inventory.life_support < colony.demand.life_support ||
      colony.inventory.fuel < colony.demand.fuel ||
      colony.inventory.materials < colony.demand.materials ||
      colony.inventory.equipment < colony.demand.equipment;

    if (needsSupply && newState.depots.length > 0) {
      // 最寄りのデポを見つける
      let nearestDepot = newState.depots[0];
      let minDistance = Infinity;

      for (const depot of newState.depots) {
        const calc = calculateDistance(depot, colony);
        if (calc.distance < minDistance) {
          minDistance = calc.distance;
          nearestDepot = depot;
        }
      }

      // 補給量を決定（需要の2ヶ月分）
      const cargo = {
        life_support: Math.max(0, colony.demand.life_support * 2 - colony.inventory.life_support),
        fuel: Math.max(0, colony.demand.fuel * 2 - colony.inventory.fuel),
        materials: Math.max(0, colony.demand.materials * 2 - colony.inventory.materials),
        equipment: Math.max(0, colony.demand.equipment * 2 - colony.inventory.equipment),
      };

      // ルートを作成
      try {
        newState = createRoute(newState, nearestDepot.id, colony.id, cargo);
      } catch (error) {
        // エラーは無視して次のコロニーへ
        console.error(error);
      }
    }
  }

  return newState;
}
