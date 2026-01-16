// 太陽系ロジスティクスゲームの型定義

/**
 * 惑星・衛星などの天体の基本情報
 */
export interface CelestialBody {
  id: string;
  name: string;
  nameJa: string;
  type: 'planet' | 'moon' | 'asteroid' | 'station';
  // 軌道情報（太陽からの距離、AU単位）
  orbitalRadius: number; // 天文単位(AU)
  // 現在の軌道位置（0-360度）
  currentAngle: number;
  // 公転周期（地球日）
  orbitalPeriod: number;
}

/**
 * コロニー（物資の需要地）
 */
export interface Colony extends CelestialBody {
  // 人口
  population: number;
  // 物資需要量（月あたり）
  demand: {
    life_support: number; // 生命維持（酸素、水、食料）
    fuel: number; // 燃料
    materials: number; // 建設資材
    equipment: number; // 機材・電子部品
  };
  // 現在の在庫
  inventory: {
    life_support: number;
    fuel: number;
    materials: number;
    equipment: number;
  };
  // 満足度（0-100）
  satisfaction: number;
}

/**
 * デポ（補給基地）の種類
 */
export type DepotType = 'small' | 'standard' | 'large' | 'specialized';

/**
 * デポ（補給拠点）
 */
export interface Depot extends CelestialBody {
  depotType: DepotType;
  // 建設コスト
  constructionCost: number;
  // 維持費（月あたり）
  maintenanceCost: number;
  // 容量（トン）
  capacity: number;
  // 現在の在庫量
  currentStock: number;
  // 特殊能力
  specialAbility?: 'fuel_production' | 'water_extraction' | 'repair' | 'manufacturing';
}

/**
 * デポの仕様定義
 */
export interface DepotSpec {
  type: DepotType;
  name: string;
  nameJa: string;
  constructionCost: number;
  maintenanceCost: number;
  capacity: number;
  description: string;
  specialAbility?: 'fuel_production' | 'water_extraction' | 'repair' | 'manufacturing';
}

/**
 * 輸送ルート
 */
export interface Route {
  id: string;
  from: string; // Depot ID
  to: string; // Colony ID
  // 輸送量
  cargo: {
    life_support: number;
    fuel: number;
    materials: number;
    equipment: number;
  };
  // 輸送コスト（距離依存）
  cost: number;
  // 輸送時間（月単位）
  duration: number;
  // ステータス
  status: 'planned' | 'in_transit' | 'delivered';
}

/**
 * 難易度設定
 */
export type Difficulty = 'easy' | 'normal' | 'hard';

/**
 * 難易度パラメータ
 */
export interface DifficultySettings {
  name: string;
  nameJa: string;
  description: string;
  initialBudget: number;
  demandMultiplier: number; // 需要倍率
  incomeMultiplier: number; // 収入倍率
  maintenanceMultiplier: number; // 維持費倍率
  satisfactionDecayMultiplier: number; // 満足度低下倍率
}

/**
 * ゲーム状態
 */
export interface GameState {
  // 現在のターン（月）
  currentTurn: number;
  // 年月表示用
  year: number;
  month: number;
  // 予算
  budget: number;
  // 収入（今月）
  income: number;
  // 支出（今月）
  expenses: number;
  // 全コロニー
  colonies: Colony[];
  // 建設済みデポ
  depots: Depot[];
  // アクティブな輸送ルート
  routes: Route[];
  // スコア情報
  score: {
    deliveryRate: number; // 配送達成率（%）
    costEfficiency: number; // コスト効率（%）
    avgDeliveryTime: number; // 平均配送時間（月）
    customerSatisfaction: number; // 顧客満足度（%）
    totalScore: number; // 総合スコア
  };
  // ゲーム終了フラグ
  isGameOver: boolean;
  // ゲーム終了理由
  gameOverReason?: 'bankruptcy' | 'max_turns' | 'all_colonies_lost' | 'victory';
  // ターン毎の履歴
  history: {
    turn: number;
    budget: number;
    totalScore: number;
    deliveryRate: number;
    customerSatisfaction: number;
    coloniesServed: number;
  }[];
  // 難易度
  difficulty: Difficulty;
  // 開始日時
  startedAt: number;
  // 最終更新日時
  lastSavedAt: number;
}

/**
 * ゲームイベント
 */
export interface GameEvent {
  id: string;
  turn: number;
  type: 'solar_flare' | 'asteroid_impact' | 'population_growth' | 'discovery' | 'political_tension';
  title: string;
  description: string;
  effects: {
    target?: string; // 影響を受ける対象のID
    type: 'cost_increase' | 'route_blocked' | 'demand_increase' | 'new_colony';
    value: number;
    duration?: number; // 効果の持続期間（ターン数）
  }[];
}

/**
 * 距離計算の結果
 */
export interface DistanceCalculation {
  distance: number; // 天文単位(AU)
  distanceKm: number; // キロメートル
  travelTime: number; // 移動時間（月）
  cost: number; // 輸送コスト
}
