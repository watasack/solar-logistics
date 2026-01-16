'use client';

import { GameState } from '@/lib/types';

interface GameResultProps {
  gameState: GameState;
  onRestart: () => void;
}

export default function GameResult({ gameState, onRestart }: GameResultProps) {
  const getResultInfo = () => {
    switch (gameState.gameOverReason) {
      case 'victory':
        return {
          title: '🎉 勝利！',
          subtitle: '太陽系の物流網を見事に構築しました！',
          color: 'from-yellow-400 to-orange-500',
          bgColor: 'bg-yellow-500/20',
          borderColor: 'border-yellow-500',
        };
      case 'bankruptcy':
        return {
          title: '💸 破産',
          subtitle: '予算が枯渇しました...',
          color: 'from-red-400 to-pink-500',
          bgColor: 'bg-red-500/20',
          borderColor: 'border-red-500',
        };
      case 'all_colonies_lost':
        return {
          title: '😢 全コロニー機能停止',
          subtitle: '全コロニーの満足度が壊滅的な状態です',
          color: 'from-gray-400 to-slate-500',
          bgColor: 'bg-gray-500/20',
          borderColor: 'border-gray-500',
        };
      case 'max_turns':
        return {
          title: '⏰ 時間切れ',
          subtitle: '10年間の運営が終了しました',
          color: 'from-blue-400 to-cyan-500',
          bgColor: 'bg-blue-500/20',
          borderColor: 'border-blue-500',
        };
      default:
        return {
          title: 'ゲーム終了',
          subtitle: '',
          color: 'from-gray-400 to-slate-500',
          bgColor: 'bg-gray-500/20',
          borderColor: 'border-gray-500',
        };
    }
  };

  const result = getResultInfo();

  // 成績評価
  const getRank = (score: number): string => {
    if (score >= 90) return 'S';
    if (score >= 80) return 'A';
    if (score >= 70) return 'B';
    if (score >= 60) return 'C';
    return 'D';
  };

  const rank = getRank(gameState.score.totalScore);

  // 統計計算
  const totalTurns = gameState.currentTurn;
  const years = Math.floor(totalTurns / 12);
  const months = totalTurns % 12;
  const avgBudget = gameState.history.reduce((sum, h) => sum + h.budget, 0) / (gameState.history.length || 1);
  const maxScore = Math.max(...gameState.history.map(h => h.totalScore), 0);
  const totalDepots = gameState.depots.length;

  return (
    <>
      {/* オーバーレイ */}
      <div className="fixed inset-0 bg-black/80 z-50 animate-fade-in" />

      {/* リザルト画面 */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-slate-900 border-2 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto animate-slide-in-up">
          {/* ヘッダー */}
          <div className={`${result.bgColor} border-b-2 ${result.borderColor} p-8 text-center`}>
            <h1 className={`text-5xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r ${result.color}`}>
              {result.title}
            </h1>
            <p className="text-xl text-slate-300">{result.subtitle}</p>
            <div className="mt-6">
              <div className="inline-block">
                <div className="text-6xl font-bold text-white mb-2">
                  {rank}
                </div>
                <div className="text-sm text-slate-400">ランク</div>
              </div>
            </div>
          </div>

          {/* 統計情報 */}
          <div className="p-8">
            {/* スコア詳細 */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-4 text-white">📊 最終スコア</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-slate-800/50 rounded-lg p-4">
                  <div className="text-xs text-slate-400 mb-1">総合スコア</div>
                  <div className="text-3xl font-bold text-yellow-400">{gameState.score.totalScore}</div>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-4">
                  <div className="text-xs text-slate-400 mb-1">配送達成率</div>
                  <div className="text-3xl font-bold text-blue-400">{gameState.score.deliveryRate}%</div>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-4">
                  <div className="text-xs text-slate-400 mb-1">コスト効率</div>
                  <div className="text-3xl font-bold text-green-400">{gameState.score.costEfficiency}%</div>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-4">
                  <div className="text-xs text-slate-400 mb-1">顧客満足度</div>
                  <div className="text-3xl font-bold text-purple-400">{gameState.score.customerSatisfaction}%</div>
                </div>
              </div>
            </div>

            {/* 運営統計 */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-4 text-white">📈 運営統計</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="bg-slate-800/50 rounded-lg p-4">
                  <div className="text-xs text-slate-400 mb-1">運営期間</div>
                  <div className="text-xl font-bold text-white">{years}年 {months}ヶ月</div>
                  <div className="text-xs text-slate-500 mt-1">{totalTurns} ターン</div>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-4">
                  <div className="text-xs text-slate-400 mb-1">最終予算</div>
                  <div className={`text-xl font-bold ${gameState.budget > 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {gameState.budget.toLocaleString()} cr
                  </div>
                  <div className="text-xs text-slate-500 mt-1">平均: {Math.round(avgBudget).toLocaleString()} cr</div>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-4">
                  <div className="text-xs text-slate-400 mb-1">建設デポ数</div>
                  <div className="text-xl font-bold text-white">{totalDepots}</div>
                  <div className="text-xs text-slate-500 mt-1">{gameState.colonies.length} コロニー</div>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-4">
                  <div className="text-xs text-slate-400 mb-1">最高スコア</div>
                  <div className="text-xl font-bold text-yellow-400">{maxScore.toFixed(1)}</div>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-4">
                  <div className="text-xs text-slate-400 mb-1">総収入</div>
                  <div className="text-xl font-bold text-green-400">
                    {gameState.history.reduce((sum, h, i) => {
                      if (i === 0) return sum;
                      const income = h.budget - gameState.history[i-1].budget + Math.abs(Math.min(0, h.budget - gameState.history[i-1].budget));
                      return sum + Math.max(0, income);
                    }, 0).toLocaleString()} cr
                  </div>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-4">
                  <div className="text-xs text-slate-400 mb-1">平均満足度</div>
                  <div className="text-xl font-bold text-purple-400">
                    {(gameState.history.reduce((sum, h) => sum + h.customerSatisfaction, 0) / (gameState.history.length || 1)).toFixed(1)}%
                  </div>
                </div>
              </div>
            </div>

            {/* 推移グラフ */}
            {gameState.history.length > 0 && (
              <div className="mb-8">
                <h2 className="text-2xl font-bold mb-4 text-white">📉 スコア推移</h2>
                <div className="bg-slate-800/50 rounded-lg p-6">
                  <div className="relative h-48">
                    <svg className="w-full h-full" viewBox="0 0 800 200" preserveAspectRatio="none">
                      {/* グリッド線 */}
                      {[0, 25, 50, 75, 100].map((y) => (
                        <line
                          key={y}
                          x1="0"
                          y1={200 - y * 2}
                          x2="800"
                          y2={200 - y * 2}
                          stroke="#334155"
                          strokeWidth="1"
                          opacity="0.3"
                        />
                      ))}

                      {/* スコア推移線 */}
                      <polyline
                        points={gameState.history.map((h, i) => {
                          const x = (i / (gameState.history.length - 1 || 1)) * 800;
                          const y = 200 - (h.totalScore / 100) * 200;
                          return `${x},${y}`;
                        }).join(' ')}
                        fill="none"
                        stroke="#fbbf24"
                        strokeWidth="3"
                      />

                      {/* 満足度推移線 */}
                      <polyline
                        points={gameState.history.map((h, i) => {
                          const x = (i / (gameState.history.length - 1 || 1)) * 800;
                          const y = 200 - (h.customerSatisfaction / 100) * 200;
                          return `${x},${y}`;
                        }).join(' ')}
                        fill="none"
                        stroke="#a78bfa"
                        strokeWidth="2"
                        opacity="0.7"
                      />
                    </svg>
                  </div>
                  <div className="flex justify-center gap-6 mt-4 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-1 bg-yellow-400"></div>
                      <span className="text-slate-300">総合スコア</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-1 bg-purple-400"></div>
                      <span className="text-slate-300">顧客満足度</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* コロニー別満足度 */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-4 text-white">🌍 コロニー状況</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {gameState.colonies.map((colony) => (
                  <div key={colony.id} className="bg-slate-800/50 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-bold text-white">{colony.nameJa}</span>
                      <span className={`text-sm font-mono ${colony.satisfaction >= 70 ? 'text-green-400' : colony.satisfaction >= 40 ? 'text-yellow-400' : 'text-red-400'}`}>
                        {colony.satisfaction.toFixed(0)}%
                      </span>
                    </div>
                    <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${colony.satisfaction >= 70 ? 'bg-green-500' : colony.satisfaction >= 40 ? 'bg-yellow-500' : 'bg-red-500'}`}
                        style={{ width: `${colony.satisfaction}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* アクションボタン */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={onRestart}
                className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-bold py-4 px-6 rounded-lg transition-all hover:shadow-lg hover:scale-105"
              >
                🔄 もう一度プレイ
              </button>
              <button
                onClick={() => {
                  // スクリーンショット機能や共有機能を将来追加可能
                  alert('スコアをクリップボードにコピーしました！');
                  navigator.clipboard.writeText(
                    `Solar Logistics\nランク: ${rank}\nスコア: ${gameState.score.totalScore}\n期間: ${years}年${months}ヶ月\n予算: ${gameState.budget.toLocaleString()} cr`
                  );
                }}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold py-4 px-6 rounded-lg transition-all"
              >
                📋 スコアをコピー
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
