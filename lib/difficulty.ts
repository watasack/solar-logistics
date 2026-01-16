import { Difficulty, DifficultySettings } from './types';

/**
 * 難易度設定の定義
 */
export const difficultySettings: Record<Difficulty, DifficultySettings> = {
  easy: {
    name: 'Easy',
    nameJa: 'イージー',
    description: '初心者向け。予算に余裕があり、コロニーの需要も少なめです。',
    initialBudget: 15000,
    demandMultiplier: 0.7,
    incomeMultiplier: 1.2,
    maintenanceMultiplier: 0.8,
    satisfactionDecayMultiplier: 0.7,
  },
  normal: {
    name: 'Normal',
    nameJa: 'ノーマル',
    description: 'バランスの取れた標準設定。適度な挑戦を楽しめます。',
    initialBudget: 10000,
    demandMultiplier: 1.0,
    incomeMultiplier: 1.0,
    maintenanceMultiplier: 1.0,
    satisfactionDecayMultiplier: 1.0,
  },
  hard: {
    name: 'Hard',
    nameJa: 'ハード',
    description: '経験者向け。厳しい予算と高い需要で、高度な戦略が求められます。',
    initialBudget: 7000,
    demandMultiplier: 1.3,
    incomeMultiplier: 0.8,
    maintenanceMultiplier: 1.5,
    satisfactionDecayMultiplier: 1.3,
  },
};

/**
 * 難易度設定を取得
 */
export function getDifficultySettings(difficulty: Difficulty): DifficultySettings {
  return difficultySettings[difficulty];
}
