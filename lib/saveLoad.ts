import { GameState } from './types';

const SAVE_KEY_PREFIX = 'solar_logistics_save_';
const MAX_SAVE_SLOTS = 3;
const AUTO_SAVE_SLOT = 'auto';

export interface SaveSlot {
  slotId: string;
  gameState: GameState;
  savedAt: number;
  isAutoSave: boolean;
}

/**
 * ゲームを保存
 */
export function saveGame(gameState: GameState, slotId: string = AUTO_SAVE_SLOT): void {
  try {
    const saveData: SaveSlot = {
      slotId,
      gameState: {
        ...gameState,
        lastSavedAt: Date.now(),
      },
      savedAt: Date.now(),
      isAutoSave: slotId === AUTO_SAVE_SLOT,
    };

    localStorage.setItem(`${SAVE_KEY_PREFIX}${slotId}`, JSON.stringify(saveData));
  } catch (error) {
    console.error('Failed to save game:', error);
    throw new Error('セーブに失敗しました。ストレージ容量を確認してください。');
  }
}

/**
 * ゲームをロード
 */
export function loadGame(slotId: string): GameState | null {
  try {
    const data = localStorage.getItem(`${SAVE_KEY_PREFIX}${slotId}`);
    if (!data) return null;

    const saveSlot: SaveSlot = JSON.parse(data);
    return saveSlot.gameState;
  } catch (error) {
    console.error('Failed to load game:', error);
    return null;
  }
}

/**
 * セーブスロットを削除
 */
export function deleteSave(slotId: string): void {
  localStorage.removeItem(`${SAVE_KEY_PREFIX}${slotId}`);
}

/**
 * 全セーブスロットを取得
 */
export function getAllSaveSlots(): SaveSlot[] {
  const slots: SaveSlot[] = [];

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(SAVE_KEY_PREFIX)) {
      try {
        const data = localStorage.getItem(key);
        if (data) {
          const slot: SaveSlot = JSON.parse(data);
          slots.push(slot);
        }
      } catch (error) {
        console.error(`Failed to load save slot ${key}:`, error);
      }
    }
  }

  // 保存日時の降順でソート
  return slots.sort((a, b) => b.savedAt - a.savedAt);
}

/**
 * オートセーブデータを取得
 */
export function getAutoSave(): SaveSlot | null {
  const data = localStorage.getItem(`${SAVE_KEY_PREFIX}${AUTO_SAVE_SLOT}`);
  if (!data) return null;

  try {
    return JSON.parse(data);
  } catch (error) {
    console.error('Failed to load auto save:', error);
    return null;
  }
}

/**
 * マニュアルセーブスロットの数を取得
 */
export function getManualSaveCount(): number {
  return getAllSaveSlots().filter(slot => !slot.isAutoSave).length;
}

/**
 * 次の利用可能なスロットIDを取得
 */
export function getNextAvailableSlotId(): string | null {
  const manualSlots = getAllSaveSlots().filter(slot => !slot.isAutoSave);

  for (let i = 1; i <= MAX_SAVE_SLOTS; i++) {
    const slotId = `slot${i}`;
    if (!manualSlots.some(slot => slot.slotId === slotId)) {
      return slotId;
    }
  }

  return null;
}

/**
 * セーブデータの概要を取得
 */
export function getSaveSummary(slot: SaveSlot): {
  turn: number;
  year: number;
  month: number;
  score: number;
  budget: number;
  difficulty: string;
  playTime: string;
  savedTime: string;
} {
  const { gameState, savedAt } = slot;
  const playTime = gameState.startedAt
    ? formatPlayTime(savedAt - gameState.startedAt)
    : '不明';

  return {
    turn: gameState.currentTurn,
    year: gameState.year,
    month: gameState.month,
    score: gameState.score.totalScore,
    budget: gameState.budget,
    difficulty: gameState.difficulty,
    playTime,
    savedTime: formatSavedTime(savedAt),
  };
}

/**
 * プレイ時間をフォーマット
 */
function formatPlayTime(ms: number): string {
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 0) {
    return `${hours}時間${minutes}分`;
  }
  return `${minutes}分`;
}

/**
 * 保存時刻をフォーマット
 */
function formatSavedTime(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));

  if (diffMins < 1) return '今';
  if (diffMins < 60) return `${diffMins}分前`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}時間前`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}日前`;

  return date.toLocaleDateString('ja-JP');
}
