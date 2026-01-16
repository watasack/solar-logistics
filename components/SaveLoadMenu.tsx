'use client';

import { useState, useEffect } from 'react';
import { SaveSlot, getAllSaveSlots, deleteSave, getSaveSummary } from '@/lib/saveLoad';
import { difficultySettings } from '@/lib/difficulty';

interface SaveLoadMenuProps {
  onLoad: (slotId: string) => void;
  onClose: () => void;
}

export default function SaveLoadMenu({ onLoad, onClose }: SaveLoadMenuProps) {
  const [saveSlots, setSaveSlots] = useState<SaveSlot[]>([]);

  useEffect(() => {
    loadSaveSlots();
  }, []);

  const loadSaveSlots = () => {
    setSaveSlots(getAllSaveSlots());
  };

  const handleDelete = (slotId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('このセーブデータを削除しますか？')) {
      deleteSave(slotId);
      loadSaveSlots();
    }
  };

  const getDifficultyBadge = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'bg-green-500/20 text-green-400 border-green-500';
      case 'normal':
        return 'bg-blue-500/20 text-blue-400 border-blue-500';
      case 'hard':
        return 'bg-red-500/20 text-red-400 border-red-500';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500';
    }
  };

  return (
    <>
      {/* オーバーレイ */}
      <div className="fixed inset-0 bg-black/80 z-50 animate-fade-in" onClick={onClose} />

      {/* モーダル */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-slate-900 border-2 border-slate-700 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto animate-slide-in-up">
          {/* ヘッダー */}
          <div className="border-b border-slate-700 p-6">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
                セーブデータ
              </h1>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
              >
                閉じる
              </button>
            </div>
          </div>

          {/* セーブスロット一覧 */}
          <div className="p-6">
            {saveSlots.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">💾</div>
                <p className="text-slate-400 text-lg mb-2">セーブデータがありません</p>
                <p className="text-slate-500 text-sm">ゲームを開始してプレイすると、自動保存されます</p>
              </div>
            ) : (
              <div className="space-y-3">
                {saveSlots.map((slot) => {
                  const summary = getSaveSummary(slot);
                  const diffSettings = difficultySettings[slot.gameState.difficulty];

                  return (
                    <div
                      key={slot.slotId}
                      onClick={() => onLoad(slot.slotId)}
                      className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 hover:bg-slate-800 hover:border-blue-500 transition-all cursor-pointer group"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="text-2xl">
                            {slot.isAutoSave ? '🔄' : '💾'}
                          </div>
                          <div>
                            <div className="font-bold text-white text-lg">
                              {slot.isAutoSave ? 'オートセーブ' : `セーブ ${slot.slotId.replace('slot', '')}`}
                            </div>
                            <div className="text-xs text-slate-400">
                              {summary.savedTime}
                            </div>
                          </div>
                        </div>
                        {!slot.isAutoSave && (
                          <button
                            onClick={(e) => handleDelete(slot.slotId, e)}
                            className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 text-sm rounded transition-colors opacity-0 group-hover:opacity-100"
                          >
                            削除
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                        <div>
                          <div className="text-xs text-slate-400 mb-1">進行状況</div>
                          <div className="text-white font-mono">
                            {summary.year}年 {summary.month}月
                          </div>
                          <div className="text-xs text-slate-500">ターン {summary.turn}</div>
                        </div>
                        <div>
                          <div className="text-xs text-slate-400 mb-1">スコア</div>
                          <div className="text-yellow-400 font-bold text-lg">{summary.score.toFixed(1)}</div>
                        </div>
                        <div>
                          <div className="text-xs text-slate-400 mb-1">予算</div>
                          <div className={`font-mono ${summary.budget > 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {summary.budget.toLocaleString()} cr
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-slate-400 mb-1">難易度</div>
                          <div className={`inline-block px-2 py-1 border rounded text-xs font-bold ${getDifficultyBadge(summary.difficulty)}`}>
                            {diffSettings.nameJa}
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 pt-3 border-t border-slate-700 text-xs text-slate-400">
                        プレイ時間: {summary.playTime}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
