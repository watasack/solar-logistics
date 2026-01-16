'use client';

import { GameState } from '@/lib/types';

interface StatisticsProps {
  gameState: GameState;
  onClose: () => void;
}

export default function Statistics({ gameState, onClose }: StatisticsProps) {
  const history = gameState.history;

  // グラフの描画領域
  const graphWidth = 600;
  const graphHeight = 200;
  const padding = { top: 20, right: 20, bottom: 30, left: 60 };
  const innerWidth = graphWidth - padding.left - padding.right;
  const innerHeight = graphHeight - padding.top - padding.bottom;

  // データポイントを座標に変換するヘルパー関数
  const createPath = (data: number[], min: number, max: number) => {
    if (data.length === 0) return '';

    const range = max - min || 1;
    const xStep = innerWidth / Math.max(data.length - 1, 1);

    const points = data.map((value, index) => {
      const x = padding.left + index * xStep;
      const y = padding.top + innerHeight - ((value - min) / range) * innerHeight;
      return `${x},${y}`;
    });

    return `M ${points.join(' L ')}`;
  };

  // 各グラフのデータ抽出
  const budgetData = history.map(h => h.budget);
  const scoreData = history.map(h => h.totalScore);
  const satisfactionData = history.map(h => h.customerSatisfaction);
  const deliveryData = history.map(h => h.deliveryRate);

  // 最小値・最大値計算
  const budgetMin = Math.min(...budgetData, 0);
  const budgetMax = Math.max(...budgetData, 1000);
  const scoreMin = 0;
  const scoreMax = 100;
  const satisfactionMin = 0;
  const satisfactionMax = 100;
  const deliveryMin = 0;
  const deliveryMax = 100;

  // グリッドライン用の値
  const createGridValues = (min: number, max: number, count: number = 5) => {
    const step = (max - min) / (count - 1);
    return Array.from({ length: count }, (_, i) => min + step * i);
  };

  // Y軸ラベル用のフォーマット
  const formatNumber = (value: number, isCurrency: boolean = false) => {
    if (isCurrency) {
      return `${Math.round(value).toLocaleString()}cr`;
    }
    return Math.round(value).toString();
  };

  // グラフコンポーネント
  const Graph = ({
    title,
    data,
    min,
    max,
    color,
    isCurrency = false,
  }: {
    title: string;
    data: number[];
    min: number;
    max: number;
    color: string;
    isCurrency?: boolean;
  }) => {
    const path = createPath(data, min, max);
    const gridValues = createGridValues(min, max);

    return (
      <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
        <h3 className="text-lg font-bold text-white mb-3">{title}</h3>
        <svg width={graphWidth} height={graphHeight} className="overflow-visible">
          {/* グリッドライン */}
          {gridValues.map((value, index) => {
            const y = padding.top + innerHeight - ((value - min) / (max - min)) * innerHeight;
            return (
              <g key={index}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={padding.left + innerWidth}
                  y2={y}
                  stroke="#334155"
                  strokeWidth="1"
                  strokeDasharray="4,4"
                />
                <text
                  x={padding.left - 10}
                  y={y + 4}
                  textAnchor="end"
                  fill="#94a3b8"
                  fontSize="12"
                >
                  {formatNumber(value, isCurrency)}
                </text>
              </g>
            );
          })}

          {/* X軸 */}
          <line
            x1={padding.left}
            y1={padding.top + innerHeight}
            x2={padding.left + innerWidth}
            y2={padding.top + innerHeight}
            stroke="#475569"
            strokeWidth="2"
          />

          {/* Y軸 */}
          <line
            x1={padding.left}
            y1={padding.top}
            x2={padding.left}
            y2={padding.top + innerHeight}
            stroke="#475569"
            strokeWidth="2"
          />

          {/* データライン */}
          {data.length > 0 && (
            <>
              {/* グラデーション定義 */}
              <defs>
                <linearGradient id={`gradient-${title}`} x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor={color} stopOpacity="0.3" />
                  <stop offset="100%" stopColor={color} stopOpacity="0.05" />
                </linearGradient>
              </defs>

              {/* エリア塗りつぶし */}
              <path
                d={`${path} L ${padding.left + innerWidth},${padding.top + innerHeight} L ${padding.left},${padding.top + innerHeight} Z`}
                fill={`url(#gradient-${title})`}
              />

              {/* ライン */}
              <path
                d={path}
                fill="none"
                stroke={color}
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* データポイント */}
              {data.map((value, index) => {
                const x = padding.left + (index * innerWidth) / Math.max(data.length - 1, 1);
                const y = padding.top + innerHeight - ((value - min) / (max - min)) * innerHeight;
                return (
                  <circle
                    key={index}
                    cx={x}
                    cy={y}
                    r="4"
                    fill={color}
                    stroke="#0f172a"
                    strokeWidth="2"
                  />
                );
              })}
            </>
          )}

          {/* X軸ラベル */}
          <text
            x={padding.left + innerWidth / 2}
            y={graphHeight - 5}
            textAnchor="middle"
            fill="#94a3b8"
            fontSize="12"
          >
            ターン
          </text>
        </svg>

        {/* 現在値表示 */}
        {data.length > 0 && (
          <div className="mt-2 text-center">
            <span className="text-slate-400 text-sm">現在値: </span>
            <span className={`font-bold text-lg`} style={{ color }}>
              {formatNumber(data[data.length - 1], isCurrency)}
            </span>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* オーバーレイ */}
      <div className="fixed inset-0 bg-black/80 z-50 animate-fade-in" onClick={onClose} />

      {/* モーダル */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-slate-900 border-2 border-slate-700 rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto animate-slide-in-up">
          {/* ヘッダー */}
          <div className="border-b border-slate-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
                  統計情報
                </h1>
                <p className="text-slate-400 mt-1">
                  {gameState.year}年{gameState.month}月 (ターン {gameState.currentTurn})
                </p>
              </div>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
              >
                閉じる
              </button>
            </div>
          </div>

          {/* コンテンツ */}
          <div className="p-6">
            {history.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📊</div>
                <p className="text-slate-400 text-lg">
                  統計データがまだありません
                </p>
                <p className="text-slate-500 text-sm mt-2">
                  ゲームを進めると、ここに推移グラフが表示されます
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* サマリーカード */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-gradient-to-br from-green-500/20 to-green-600/10 border border-green-500/30 rounded-lg p-4">
                    <div className="text-sm text-green-300 mb-1">予算</div>
                    <div className="text-2xl font-bold text-green-400">
                      {gameState.budget.toLocaleString()}
                    </div>
                    <div className="text-xs text-green-300/70 mt-1">cr</div>
                  </div>

                  <div className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/10 border border-yellow-500/30 rounded-lg p-4">
                    <div className="text-sm text-yellow-300 mb-1">総合スコア</div>
                    <div className="text-2xl font-bold text-yellow-400">
                      {gameState.score.totalScore.toFixed(1)}
                    </div>
                    <div className="text-xs text-yellow-300/70 mt-1">/ 100</div>
                  </div>

                  <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-500/30 rounded-lg p-4">
                    <div className="text-sm text-blue-300 mb-1">顧客満足度</div>
                    <div className="text-2xl font-bold text-blue-400">
                      {gameState.score.customerSatisfaction.toFixed(1)}
                    </div>
                    <div className="text-xs text-blue-300/70 mt-1">%</div>
                  </div>

                  <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/10 border border-purple-500/30 rounded-lg p-4">
                    <div className="text-sm text-purple-300 mb-1">配送達成率</div>
                    <div className="text-2xl font-bold text-purple-400">
                      {gameState.score.deliveryRate.toFixed(1)}
                    </div>
                    <div className="text-xs text-purple-300/70 mt-1">%</div>
                  </div>
                </div>

                {/* グラフ */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Graph
                    title="予算推移"
                    data={budgetData}
                    min={budgetMin}
                    max={budgetMax}
                    color="#22c55e"
                    isCurrency={true}
                  />

                  <Graph
                    title="総合スコア"
                    data={scoreData}
                    min={scoreMin}
                    max={scoreMax}
                    color="#eab308"
                  />

                  <Graph
                    title="顧客満足度"
                    data={satisfactionData}
                    min={satisfactionMin}
                    max={satisfactionMax}
                    color="#3b82f6"
                  />

                  <Graph
                    title="配送達成率"
                    data={deliveryData}
                    min={deliveryMin}
                    max={deliveryMax}
                    color="#a855f7"
                  />
                </div>

                {/* コロニー別統計 */}
                <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                  <h3 className="text-lg font-bold text-white mb-3">コロニー別状況</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-700">
                          <th className="text-left py-2 px-3 text-slate-400">コロニー</th>
                          <th className="text-right py-2 px-3 text-slate-400">人口</th>
                          <th className="text-right py-2 px-3 text-slate-400">満足度</th>
                          <th className="text-right py-2 px-3 text-slate-400">生命維持</th>
                          <th className="text-right py-2 px-3 text-slate-400">燃料</th>
                          <th className="text-right py-2 px-3 text-slate-400">資材</th>
                          <th className="text-right py-2 px-3 text-slate-400">機器</th>
                        </tr>
                      </thead>
                      <tbody>
                        {gameState.colonies.map((colony) => {
                          const satisfactionColor =
                            colony.satisfaction >= 70
                              ? 'text-green-400'
                              : colony.satisfaction >= 40
                              ? 'text-yellow-400'
                              : 'text-red-400';

                          return (
                            <tr key={colony.id} className="border-b border-slate-700/50">
                              <td className="py-2 px-3 text-white font-medium">{colony.name}</td>
                              <td className="py-2 px-3 text-right text-slate-300 font-mono">
                                {colony.population.toLocaleString()}
                              </td>
                              <td className={`py-2 px-3 text-right font-bold ${satisfactionColor}`}>
                                {colony.satisfaction.toFixed(0)}%
                              </td>
                              <td className="py-2 px-3 text-right text-slate-300 font-mono">
                                {colony.inventory.life_support} / {colony.demand.life_support * 2}
                              </td>
                              <td className="py-2 px-3 text-right text-slate-300 font-mono">
                                {colony.inventory.fuel} / {colony.demand.fuel * 2}
                              </td>
                              <td className="py-2 px-3 text-right text-slate-300 font-mono">
                                {colony.inventory.materials} / {colony.demand.materials * 2}
                              </td>
                              <td className="py-2 px-3 text-right text-slate-300 font-mono">
                                {colony.inventory.equipment} / {colony.demand.equipment * 2}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
