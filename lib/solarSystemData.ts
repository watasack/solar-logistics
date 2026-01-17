import { Colony, DepotSpec } from './types';

/**
 * 太陽系の惑星・衛星データ
 * 軌道半径は天文単位(AU)、公転周期は地球日
 */
export const celestialBodies = {
  // 内惑星
  mercury: {
    id: 'mercury',
    name: 'Mercury',
    nameJa: '水星',
    type: 'planet' as const,
    orbitalRadius: 0.39, // 半長軸
    currentAngle: 0,
    orbitalPeriod: 88,
    eccentricity: 0.206, // 実際の離心率
    longitudeOfPerihelion: 77,
    inclination: 7.0,
  },
  venus: {
    id: 'venus',
    name: 'Venus',
    nameJa: '金星',
    type: 'planet' as const,
    orbitalRadius: 0.72,
    currentAngle: 45,
    orbitalPeriod: 225,
    eccentricity: 0.007,
    longitudeOfPerihelion: 131,
    inclination: 3.4,
  },
  earth: {
    id: 'earth',
    name: 'Earth',
    nameJa: '地球',
    type: 'planet' as const,
    orbitalRadius: 1.0,
    currentAngle: 90,
    orbitalPeriod: 365,
    eccentricity: 0.017,
    longitudeOfPerihelion: 102,
    inclination: 0.0, // 基準面
  },
  moon: {
    id: 'moon',
    name: 'Moon',
    nameJa: '月',
    type: 'moon' as const,
    orbitalRadius: 1.0, // 地球と同じ軌道上
    currentAngle: 90,
    orbitalPeriod: 365,
    eccentricity: 0.017, // 地球と同じ
    longitudeOfPerihelion: 102,
    inclination: 0.0,
  },
  mars: {
    id: 'mars',
    name: 'Mars',
    nameJa: '火星',
    type: 'planet' as const,
    orbitalRadius: 1.52,
    currentAngle: 135,
    orbitalPeriod: 687,
    eccentricity: 0.093, // 顕著な楕円軌道
    longitudeOfPerihelion: 336,
    inclination: 1.9,
  },
  phobos: {
    id: 'phobos',
    name: 'Phobos',
    nameJa: 'フォボス',
    type: 'moon' as const,
    orbitalRadius: 1.52,
    currentAngle: 135,
    orbitalPeriod: 687,
    eccentricity: 0.093,
    longitudeOfPerihelion: 336,
    inclination: 1.9,
  },

  // 小惑星帯
  ceres: {
    id: 'ceres',
    name: 'Ceres',
    nameJa: 'ケレス',
    type: 'asteroid' as const,
    orbitalRadius: 2.77,
    currentAngle: 180,
    orbitalPeriod: 1680,
    eccentricity: 0.076,
    longitudeOfPerihelion: 73,
    inclination: 10.6, // 大きく傾いた軌道
  },
  vesta: {
    id: 'vesta',
    name: 'Vesta',
    nameJa: 'ベスタ',
    type: 'asteroid' as const,
    orbitalRadius: 2.36,
    currentAngle: 170,
    orbitalPeriod: 1325,
    eccentricity: 0.089,
    longitudeOfPerihelion: 151,
    inclination: 7.1,
  },

  // 木星系
  jupiter: {
    id: 'jupiter',
    name: 'Jupiter',
    nameJa: '木星',
    type: 'planet' as const,
    orbitalRadius: 5.2,
    currentAngle: 225,
    orbitalPeriod: 4333,
    eccentricity: 0.048,
    longitudeOfPerihelion: 14,
    inclination: 1.3,
  },
  io: {
    id: 'io',
    name: 'Io',
    nameJa: 'イオ',
    type: 'moon' as const,
    orbitalRadius: 5.2,
    currentAngle: 225,
    orbitalPeriod: 4333,
    eccentricity: 0.048,
    longitudeOfPerihelion: 14,
    inclination: 1.3,
  },
  europa: {
    id: 'europa',
    name: 'Europa',
    nameJa: 'エウロパ',
    type: 'moon' as const,
    orbitalRadius: 5.2,
    currentAngle: 225,
    orbitalPeriod: 4333,
    eccentricity: 0.048,
    longitudeOfPerihelion: 14,
    inclination: 1.3,
  },
  ganymede: {
    id: 'ganymede',
    name: 'Ganymede',
    nameJa: 'ガニメデ',
    type: 'moon' as const,
    orbitalRadius: 5.2,
    currentAngle: 225,
    orbitalPeriod: 4333,
    eccentricity: 0.048,
    longitudeOfPerihelion: 14,
    inclination: 1.3,
  },

  // 土星系
  saturn: {
    id: 'saturn',
    name: 'Saturn',
    nameJa: '土星',
    type: 'planet' as const,
    orbitalRadius: 9.54,
    currentAngle: 270,
    orbitalPeriod: 10759,
    eccentricity: 0.054,
    longitudeOfPerihelion: 93,
    inclination: 2.5,
  },
  titan: {
    id: 'titan',
    name: 'Titan',
    nameJa: 'タイタン',
    type: 'moon' as const,
    orbitalRadius: 9.54,
    currentAngle: 270,
    orbitalPeriod: 10759,
    eccentricity: 0.054,
    longitudeOfPerihelion: 93,
    inclination: 2.5,
  },
  enceladus: {
    id: 'enceladus',
    name: 'Enceladus',
    nameJa: 'エンケラドゥス',
    type: 'moon' as const,
    orbitalRadius: 9.54,
    currentAngle: 270,
    orbitalPeriod: 10759,
    eccentricity: 0.054,
    longitudeOfPerihelion: 93,
    inclination: 2.5,
  },
};

/**
 * 初期コロニーデータ
 */
export const initialColonies: Colony[] = [
  {
    ...celestialBodies.moon,
    population: 50000,
    demand: {
      life_support: 100,
      fuel: 50,
      materials: 80,
      equipment: 60,
    },
    inventory: {
      life_support: 200,
      fuel: 100,
      materials: 150,
      equipment: 120,
    },
    satisfaction: 80,
  },
  {
    ...celestialBodies.mars,
    population: 30000,
    demand: {
      life_support: 80,
      fuel: 40,
      materials: 100,
      equipment: 50,
    },
    inventory: {
      life_support: 150,
      fuel: 80,
      materials: 180,
      equipment: 100,
    },
    satisfaction: 75,
  },
  {
    ...celestialBodies.phobos,
    population: 5000,
    demand: {
      life_support: 20,
      fuel: 30,
      materials: 25,
      equipment: 15,
    },
    inventory: {
      life_support: 40,
      fuel: 60,
      materials: 50,
      equipment: 30,
    },
    satisfaction: 70,
  },
  {
    ...celestialBodies.ceres,
    population: 8000,
    demand: {
      life_support: 30,
      fuel: 20,
      materials: 40,
      equipment: 35,
    },
    inventory: {
      life_support: 60,
      fuel: 40,
      materials: 80,
      equipment: 70,
    },
    satisfaction: 65,
  },
  {
    ...celestialBodies.europa,
    population: 12000,
    demand: {
      life_support: 40,
      fuel: 35,
      materials: 30,
      equipment: 45,
    },
    inventory: {
      life_support: 80,
      fuel: 70,
      materials: 60,
      equipment: 90,
    },
    satisfaction: 60,
  },
  {
    ...celestialBodies.titan,
    population: 15000,
    demand: {
      life_support: 50,
      fuel: 45,
      materials: 35,
      equipment: 50,
    },
    inventory: {
      life_support: 100,
      fuel: 90,
      materials: 70,
      equipment: 100,
    },
    satisfaction: 55,
  },
];

/**
 * デポの種類別仕様
 */
export const depotSpecs: Record<string, DepotSpec> = {
  small: {
    type: 'small',
    name: 'Small Relay Station',
    nameJa: '小型中継点',
    constructionCost: 500,
    maintenanceCost: 20,
    capacity: 500,
    description: '最小限の補給機能を持つ小型ステーション',
  },
  standard: {
    type: 'standard',
    name: 'Standard Depot',
    nameJa: '標準デポ',
    constructionCost: 1500,
    maintenanceCost: 60,
    capacity: 2000,
    description: '燃料補給機能を持つ標準的な補給基地',
    specialAbility: 'fuel_production',
  },
  large: {
    type: 'large',
    name: 'Large Hub',
    nameJa: '大型ハブ',
    constructionCost: 4000,
    maintenanceCost: 150,
    capacity: 5000,
    description: '修理・製造機能を持つ大規模物流拠点',
    specialAbility: 'manufacturing',
  },
  specialized: {
    type: 'specialized',
    name: 'Specialized Facility',
    nameJa: '特殊施設',
    constructionCost: 3000,
    maintenanceCost: 100,
    capacity: 1500,
    description: '水採掘など特殊な機能を持つ施設',
    specialAbility: 'water_extraction',
  },
};

/**
 * 建設可能な候補地点
 * 実際のゲームではプレイヤーが選択できる地点
 */
export const buildableSites = [
  celestialBodies.earth, // 地球軌道ステーション
  celestialBodies.mars, // 火星軌道ステーション
  celestialBodies.vesta, // ベスタ
  celestialBodies.ceres, // ケレス
  celestialBodies.io, // イオ
  celestialBodies.ganymede, // ガニメデ
  celestialBodies.titan, // タイタン
];
