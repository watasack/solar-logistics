'use client';

import { Difficulty } from '@/lib/types';
import { difficultySettings } from '@/lib/difficulty';

interface DifficultySelectorProps {
  onSelect: (difficulty: Difficulty) => void;
  onCancel: () => void;
}

export default function DifficultySelector({ onSelect, onCancel }: DifficultySelectorProps) {
  const difficulties: Difficulty[] = ['easy', 'normal', 'hard'];

  const getDifficultyColor = (difficulty: Difficulty) => {
    switch (difficulty) {
      case 'easy':
        return {
          gradient: 'from-green-400 to-emerald-500',
          bg: 'bg-green-500/20',
          border: 'border-green-500',
          hover: 'hover:bg-green-500/30',
        };
      case 'normal':
        return {
          gradient: 'from-blue-400 to-cyan-500',
          bg: 'bg-blue-500/20',
          border: 'border-blue-500',
          hover: 'hover:bg-blue-500/30',
        };
      case 'hard':
        return {
          gradient: 'from-red-400 to-orange-500',
          bg: 'bg-red-500/20',
          border: 'border-red-500',
          hover: 'hover:bg-red-500/30',
        };
    }
  };

  return (
    <>
      {/* オーバーレイ */}
      <div className="fixed inset-0 bg-black/80 z-50 animate-fade-in" />

      {/* モーダル */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-slate-900 border-2 border-slate-700 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto animate-slide-in-up">
          {/* ヘッダー */}
          <div className="border-b border-slate-700 p-6 text-center">
            <h1 className="text-3xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
              難易度を選択
            </h1>
            <p className="text-slate-400">あなたのスキルに合った難易度を選んでください</p>
          </div>

          {/* 難易度カード */}
          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            {difficulties.map((difficulty) => {
              const settings = difficultySettings[difficulty];
              const colors = getDifficultyColor(difficulty);

              return (
                <button
                  key={difficulty}
                  onClick={() => onSelect(difficulty)}
                  className={`${colors.bg} ${colors.border} ${colors.hover} border-2 rounded-xl p-6 text-left transition-all duration-300 hover:scale-105 hover:shadow-xl`}
                >
                  {/* タイトル */}
                  <div className={`text-2xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r ${colors.gradient}`}>
                    {settings.nameJa}
                  </div>

                  {/* 説明 */}
                  <p className="text-sm text-slate-300 mb-4 min-h-[3rem]">
                    {settings.description}
                  </p>

                  {/* パラメータ */}
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400">初期予算</span>
                      <span className="text-white font-mono">{settings.initialBudget.toLocaleString()} cr</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">コロニー需要</span>
                      <span className="text-white font-mono">{(settings.demandMultiplier * 100).toFixed(0)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">収入</span>
                      <span className="text-white font-mono">{(settings.incomeMultiplier * 100).toFixed(0)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">維持費</span>
                      <span className="text-white font-mono">{(settings.maintenanceMultiplier * 100).toFixed(0)}%</span>
                    </div>
                  </div>

                  {/* 選択ボタン */}
                  <div className={`mt-4 py-2 text-center rounded-lg bg-gradient-to-r ${colors.gradient} text-white font-bold`}>
                    選択
                  </div>
                </button>
              );
            })}
          </div>

          {/* キャンセルボタン */}
          <div className="border-t border-slate-700 p-6">
            <button
              onClick={onCancel}
              className="w-full py-3 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-lg transition-colors"
            >
              キャンセル
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
