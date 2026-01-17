import { GameState, Colony, Depot, Route, Difficulty } from './types';
import { initialColonies } from './solarSystemData';
import { calculateDistance } from './optimizer';
import { getDifficultySettings } from './difficulty';

/**
 * 新しいゲームを初期化
 */
export function initializeGame(difficulty: Difficulty = 'normal'): GameState {
  const diffSettings = getDifficultySettings(difficulty);
  const colonies = JSON.parse(JSON.stringify(initialColonies)) as Colony[];

  // 難易度に応じて需要を調整
  colonies.forEach(colony => {
    colony.demand.life_support = Math.round(colony.demand.life_support * diffSettings.demandMultiplier);
    colony.demand.fuel = Math.round(colony.demand.fuel * diffSettings.demandMultiplier);
    colony.demand.materials = Math.round(colony.demand.materials * diffSettings.demandMultiplier);
    colony.demand.equipment = Math.round(colony.demand.equipment * diffSettings.demandMultiplier);
  });

  return {
    currentTurn: 0,
    year: 2150,
    month: 1,
    epoch: 0, // 2150年1月1日からの日数
    budget: diffSettings.initialBudget,
    income: 0,
    expenses: 0,
    colonies,
    depots: [],
    routes: [],
    score: {
      deliveryRate: 100,
      costEfficiency: 100,
      avgDeliveryTime: 0,
      customerSatisfaction: 70,
      totalScore: 85,
    },
    isGameOver: false,
    gameOverReason: undefined,
    history: [],
    difficulty,
    startedAt: Date.now(),
    lastSavedAt: Date.now(),
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

  // epoch（日数）を更新（1ターン = 30日）
  newState.epoch += 30;

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

  // 履歴に追加
  addToHistory(newState);

  // ゲーム終了条件をチェック
  checkGameOver(newState);

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
        const colony = state.colonies.find(c => c.id === route.to);
        if (colony) {
          colony.inventory.life_support += route.cargo.life_support;
          colony.inventory.fuel += route.cargo.fuel;
          colony.inventory.materials += route.cargo.materials;
          colony.inventory.equipment += route.cargo.equipment;
        }
        completedRoutes.push(route.id);
      }
    }
  }

  // 完了したルートを削除
  state.routes = state.routes.filter(r => !completedRoutes.includes(r.id));
}

/**
 * 収支を計算
 */
function calculateFinances(state: GameState): void {
  const diffSettings = getDifficultySettings(state.difficulty);

  // 収入: コロニーからの支払い（満足度に応じて、難易度補正）
  let income = 0;
  for (const colony of state.colonies) {
    const baseIncome = colony.population / 100; // 人口100人あたり1cr
    const satisfactionMultiplier = colony.satisfaction / 100;
    income += baseIncome * satisfactionMultiplier * diffSettings.incomeMultiplier;
  }

  // 支出: デポの維持費（難易度補正）
  let expenses = 0;
  for (const depot of state.depots) {
    expenses += depot.maintenanceCost * diffSettings.maintenanceMultiplier;
  }

  // 支出: 輸送コスト
  for (const route of state.routes) {
    if (route.status === 'in_transit') {
      expenses += route.cost;
    }
  }

  state.income = Math.round(income);
  state.expenses = Math.round(expenses);
  state.budget += state.income - state.expenses;
}

/**
 * 満足度を更新
 */
function updateSatisfaction(state: GameState): void {
  const diffSettings = getDifficultySettings(state.difficulty);

  for (const colony of state.colonies) {
    // 各物資の充足率を計算
    const supplyRatio = {
      life_support: colony.inventory.life_support / (colony.demand.life_support * 2),
      fuel: colony.inventory.fuel / (colony.demand.fuel * 2),
      materials: colony.inventory.materials / (colony.demand.materials * 2),
      equipment: colony.inventory.equipment / (colony.demand.equipment * 2),
    };

    // 平均充足率
    const avgRatio =
      (supplyRatio.life_support +
        supplyRatio.fuel +
        supplyRatio.materials +
        supplyRatio.equipment) / 4;

    // 満足度を更新（緩やかに変化、難易度補正で低下速度調整）
    const targetSatisfaction = Math.min(100, avgRatio * 100);
    const changeRate = 0.3 * diffSettings.satisfactionDecayMultiplier;
    const change = (targetSatisfaction - colony.satisfaction) * changeRate;
    colony.satisfaction = Math.max(0, Math.min(100, colony.satisfaction + change));
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

  // 同じ場所に既に建設されていないかチェック
  const exists = newState.depots.some(d => d.id === depot.id);
  if (exists) {
    throw new Error('この場所には既にデポが建設されています');
  }

  // デポを追加
  newState.depots.push(depot);
  newState.budget -= depot.constructionCost;

  return newState;
}

/**
 * 輸送ルートを作成
 */
export function createRoute(
  state: GameState,
  fromId: string,
  toId: string,
  cargo: { life_support: number; fuel: number; materials: number; equipment: number }
): GameState {
  const newState = JSON.parse(JSON.stringify(state)) as GameState;

  const depot = newState.depots.find(d => d.id === fromId);
  const colony = newState.colonies.find(c => c.id === toId);

  if (!depot || !colony) {
    throw new Error('デポまたはコロニーが見つかりません');
  }

  // 距離とコストを計算
  const distanceCalc = calculateDistance(depot, colony);

  // ルートを作成
  const route: Route = {
    id: `route-${Date.now()}-${Math.random()}`,
    from: fromId,
    to: toId,
    cargo,
    cost: distanceCalc.cost,
    duration: Math.ceil(distanceCalc.travelTime),
    status: 'in_transit',
  };

  newState.routes.push(route);

  return newState;
}

/**
 * 自動補給システム
 * 各コロニーの在庫が少なくなったら、最寄りのデポから自動で補給
 */
export function autoSupply(state: GameState): GameState {
  let newState = JSON.parse(JSON.stringify(state)) as GameState;

  if (newState.depots.length === 0) {
    return newState;
  }

  for (const colony of newState.colonies) {
    // 在庫が需要の1.5ヶ月分以下なら補給
    const needsSupply =
      colony.inventory.life_support < colony.demand.life_support * 1.5 ||
      colony.inventory.fuel < colony.demand.fuel * 1.5 ||
      colony.inventory.materials < colony.demand.materials * 1.5 ||
      colony.inventory.equipment < colony.demand.equipment * 1.5;

    if (needsSupply) {
      // 最寄りのデポを探す
      let nearestDepot: Depot | null = null;
      let minDistance = Infinity;

      for (const depot of newState.depots) {
        const dist = calculateDistance(depot, colony);
        if (dist.distance < minDistance) {
          minDistance = dist.distance;
          nearestDepot = depot;
        }
      }

      if (!nearestDepot) continue;

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

/**
 * 履歴に現在の状態を追加
 */
function addToHistory(state: GameState): void {
  const coloniesServed = state.colonies.filter(c => {
    const totalInventory = c.inventory.life_support + c.inventory.fuel + c.inventory.materials + c.inventory.equipment;
    const totalDemand = c.demand.life_support + c.demand.fuel + c.demand.materials + c.demand.equipment;
    return totalInventory >= totalDemand * 0.5; // 需要の50%以上在庫があればサービス中とみなす
  }).length;

  state.history.push({
    turn: state.currentTurn,
    budget: state.budget,
    totalScore: state.score.totalScore,
    deliveryRate: state.score.deliveryRate,
    customerSatisfaction: state.score.customerSatisfaction,
    coloniesServed,
  });

  // 履歴は最大120ターン分保持（10年分）
  if (state.history.length > 120) {
    state.history.shift();
  }
}

/**
 * ゲーム終了条件をチェック
 */
function checkGameOver(state: GameState): void {
  const MAX_TURNS = 120; // 10年（120ヶ月）
  const BANKRUPTCY_THRESHOLD = -5000; // 破産ライン
  const VICTORY_SCORE = 95; // 勝利スコア
  const VICTORY_TURNS = 60; // 5年以上続けば勝利判定

  // 既にゲームオーバーならスキップ
  if (state.isGameOver) {
    return;
  }

  // 1. 破産チェック
  if (state.budget < BANKRUPTCY_THRESHOLD) {
    state.isGameOver = true;
    state.gameOverReason = 'bankruptcy';
    return;
  }

  // 2. 最大ターン到達
  if (state.currentTurn >= MAX_TURNS) {
    state.isGameOver = true;
    state.gameOverReason = 'max_turns';
    return;
  }

  // 3. 全コロニー満足度壊滅（全て20%以下）
  const allColoniesLost = state.colonies.every(c => c.satisfaction < 20);
  if (allColoniesLost && state.currentTurn > 12) { // 最初の1年は猶予
    state.isGameOver = true;
    state.gameOverReason = 'all_colonies_lost';
    return;
  }

  // 4. 勝利条件（高スコアを維持）
  if (
    state.currentTurn >= VICTORY_TURNS &&
    state.score.totalScore >= VICTORY_SCORE &&
    state.score.customerSatisfaction >= 90 &&
    state.budget > 5000
  ) {
    state.isGameOver = true;
    state.gameOverReason = 'victory';
    return;
  }
}
