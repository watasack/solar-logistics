'use client';

import { useState, useEffect } from 'react';
import SolarSystemMap from '@/components/SolarSystemMap';
import { GameState, Colony, Depot, DepotType } from '@/lib/types';
import { initializeGame, advanceTurn, buildDepot, autoSupply } from '@/lib/gameLogic';
import { buildableSites, depotSpecs } from '@/lib/solarSystemData';
import { generateRecommendedPlacement } from '@/lib/optimizer';

export default function Home() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [selectedColony, setSelectedColony] = useState<Colony | null>(null);
  const [selectedDepot, setSelectedDepot] = useState<Depot | null>(null);
  const [showBuildMenu, setShowBuildMenu] = useState(false);
  const [selectedBuildSite, setSelectedBuildSite] = useState<string | null>(null);
  const [selectedDepotType, setSelectedDepotType] = useState<DepotType>('standard');

  // ゲームを初期化
  useEffect(() => {
    setGameState(initializeGame());
  }, []);

  if (!gameState) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  // ターンを進める
  const handleNextTurn = () => {
    const newState = advanceTurn(gameState);
    const suppliedState = autoSupply(newState);
    setGameState(suppliedState);
    setSelectedColony(null);
    setSelectedDepot(null);
  };

  // デポを建設
  const handleBuildDepot = () => {
    if (!selectedBuildSite) return;

    const site = buildableSites.find(s => s.id === selectedBuildSite);
    if (!site) return;

    const spec = depotSpecs[selectedDepotType];
    const newDepot: Depot = {
      ...site,
      depotType: selectedDepotType,
      constructionCost: spec.constructionCost,
      maintenanceCost: spec.maintenanceCost,
      capacity: spec.capacity,
      currentStock: 0,
      specialAbility: spec.specialAbility,
    };

    try {
      const newState = buildDepot(gameState, newDepot);
      setGameState(newState);
      setShowBuildMenu(false);
      setSelectedBuildSite(null);
    } catch (error) {
      alert(error instanceof Error ? error.message : '建設に失敗しました');
    }
  };

  // 最適配置の提案
  const handleOptimize = () => {
    const result = generateRecommendedPlacement(
      gameState.colonies,
      buildableSites,
      gameState.budget,
      'standard'
    );

    alert(
      `推奨されるデポ配置:\n` +
      `建設地点: ${result.sites.map(s => s.nameJa).join(', ')}\n\n` +
      `評価:\n` +
      `総コスト: ${result.evaluation.totalCost.toLocaleString()} credits\n` +
      `カバー率: ${result.evaluation.coverageRate}%\n` +
      `平均距離: ${result.evaluation.avgDistance} AU\n` +
      `最大距離: ${result.evaluation.maxDistance} AU`
    );
  };

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      {/* ヘッダー */}
      <div className="border-b border-slate-800 bg-slate-900/50 backdrop-blur">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
                Solar Logistics
              </h1>
              <p className="text-sm text-slate-400">太陽系補給線マネジメント</p>
            </div>
            <div className="flex items-center gap-6 text-sm">
              <div>
                <span className="text-slate-400">年月:</span>{' '}
                <span className="font-mono text-blue-400">{gameState.year}年 {gameState.month}月</span>
              </div>
              <div>
                <span className="text-slate-400">ターン:</span>{' '}
                <span className="font-mono">{gameState.currentTurn}</span>
              </div>
              <div>
                <span className="text-slate-400">予算:</span>{' '}
                <span className={`font-mono font-bold ${gameState.budget > 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {gameState.budget.toLocaleString()} cr
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左カラム: マップ */}
          <div className="lg:col-span-2 space-y-4">
            {/* スコアボード */}
            <div className="bg-slate-900/50 backdrop-blur border border-slate-800 rounded-lg p-4">
              <h2 className="text-lg font-bold mb-3">パフォーマンス指標</h2>
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <div className="text-xs text-slate-400 mb-1">配送達成率</div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold">{gameState.score.deliveryRate}</span>
                    <span className="text-sm text-slate-400">%</span>
                  </div>
                  <div className="mt-1 h-1 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500"
                      style={{ width: `${gameState.score.deliveryRate}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-400 mb-1">コスト効率</div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold">{gameState.score.costEfficiency}</span>
                    <span className="text-sm text-slate-400">%</span>
                  </div>
                  <div className="mt-1 h-1 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500"
                      style={{ width: `${gameState.score.costEfficiency}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-400 mb-1">顧客満足度</div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold">{gameState.score.customerSatisfaction}</span>
                    <span className="text-sm text-slate-400">%</span>
                  </div>
                  <div className="mt-1 h-1 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-purple-500"
                      style={{ width: `${gameState.score.customerSatisfaction}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-400 mb-1">総合スコア</div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-yellow-400">{gameState.score.totalScore}</span>
                    <span className="text-sm text-slate-400">pts</span>
                  </div>
                  <div className="mt-1 h-1 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-yellow-500"
                      style={{ width: `${gameState.score.totalScore}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* マップ */}
            <div className="bg-slate-900/50 backdrop-blur border border-slate-800 rounded-lg p-4">
              <div className="aspect-square">
                <SolarSystemMap
                  colonies={gameState.colonies}
                  depots={gameState.depots}
                  onSelectColony={setSelectedColony}
                  onSelectDepot={setSelectedDepot}
                  selectedId={selectedColony?.id || selectedDepot?.id}
                />
              </div>
            </div>
          </div>

          {/* 右カラム: 情報とアクション */}
          <div className="space-y-4">
            {/* 収支 */}
            <div className="bg-slate-900/50 backdrop-blur border border-slate-800 rounded-lg p-4">
              <h2 className="text-lg font-bold mb-3">今月の収支</h2>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">収入</span>
                  <span className="text-green-400 font-mono">+{gameState.income.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">支出</span>
                  <span className="text-red-400 font-mono">-{gameState.expenses.toLocaleString()}</span>
                </div>
                <div className="border-t border-slate-700 pt-2 flex justify-between font-bold">
                  <span>純利益</span>
                  <span className={gameState.income - gameState.expenses > 0 ? 'text-green-400' : 'text-red-400'}>
                    {(gameState.income - gameState.expenses).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* 選択された情報 */}
            {selectedColony && (
              <div className="bg-slate-900/50 backdrop-blur border border-slate-800 rounded-lg p-4">
                <h2 className="text-lg font-bold mb-3 text-blue-400">{selectedColony.nameJa}</h2>
                <div className="space-y-3 text-sm">
                  <div>
                    <div className="text-slate-400 mb-1">人口</div>
                    <div className="font-mono">{selectedColony.population.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-slate-400 mb-1">満足度</div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500"
                          style={{ width: `${selectedColony.satisfaction}%` }}
                        />
                      </div>
                      <span className="font-mono">{selectedColony.satisfaction}%</span>
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-400 mb-2">在庫状況</div>
                    <div className="space-y-2">
                      {Object.entries(selectedColony.inventory).map(([key, value]) => {
                        const demand = selectedColony.demand[key as keyof typeof selectedColony.demand];
                        const ratio = (value / (demand * 2)) * 100;
                        return (
                          <div key={key}>
                            <div className="flex justify-between text-xs mb-1">
                              <span className="capitalize">{key.replace('_', ' ')}</span>
                              <span className="font-mono">{value} / {demand}</span>
                            </div>
                            <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                              <div
                                className={`h-full ${ratio > 50 ? 'bg-green-500' : ratio > 25 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                style={{ width: `${Math.min(100, ratio)}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* アクション */}
            <div className="bg-slate-900/50 backdrop-blur border border-slate-800 rounded-lg p-4">
              <h2 className="text-lg font-bold mb-3">アクション</h2>
              <div className="space-y-2">
                <button
                  onClick={handleNextTurn}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-colors"
                >
                  次のターンへ
                </button>
                <button
                  onClick={() => setShowBuildMenu(!showBuildMenu)}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition-colors"
                >
                  デポを建設
                </button>
                <button
                  onClick={handleOptimize}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-lg transition-colors"
                >
                  最適配置を提案
                </button>
              </div>
            </div>

            {/* 建設メニュー */}
            {showBuildMenu && (
              <div className="bg-slate-900/50 backdrop-blur border border-slate-800 rounded-lg p-4">
                <h2 className="text-lg font-bold mb-3">デポ建設</h2>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">建設地点</label>
                    <select
                      value={selectedBuildSite || ''}
                      onChange={(e) => setSelectedBuildSite(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm"
                    >
                      <option value="">選択してください</option>
                      {buildableSites.map(site => (
                        <option key={site.id} value={site.id}>
                          {site.nameJa} ({site.orbitalRadius.toFixed(2)} AU)
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">デポタイプ</label>
                    <select
                      value={selectedDepotType}
                      onChange={(e) => setSelectedDepotType(e.target.value as DepotType)}
                      className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm"
                    >
                      {Object.values(depotSpecs).map(spec => (
                        <option key={spec.type} value={spec.type}>
                          {spec.nameJa} - {spec.constructionCost} cr
                        </option>
                      ))}
                    </select>
                  </div>
                  {selectedDepotType && (
                    <div className="text-xs text-slate-400 bg-slate-800/50 rounded p-3">
                      <div>{depotSpecs[selectedDepotType].description}</div>
                      <div className="mt-2 space-y-1">
                        <div>容量: {depotSpecs[selectedDepotType].capacity} トン</div>
                        <div>維持費: {depotSpecs[selectedDepotType].maintenanceCost} cr/月</div>
                      </div>
                    </div>
                  )}
                  <button
                    onClick={handleBuildDepot}
                    disabled={!selectedBuildSite}
                    className="w-full bg-green-600 hover:bg-green-700 disabled:bg-slate-700 disabled:text-slate-500 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                  >
                    建設する
                  </button>
                </div>
              </div>
            )}

            {/* デポ一覧 */}
            <div className="bg-slate-900/50 backdrop-blur border border-slate-800 rounded-lg p-4">
              <h2 className="text-lg font-bold mb-3">建設済みデポ</h2>
              {gameState.depots.length === 0 ? (
                <p className="text-sm text-slate-400">デポがまだ建設されていません</p>
              ) : (
                <div className="space-y-2">
                  {gameState.depots.map(depot => (
                    <div
                      key={depot.id}
                      onClick={() => setSelectedDepot(depot)}
                      className="bg-slate-800/50 rounded p-3 cursor-pointer hover:bg-slate-800 transition-colors text-sm"
                    >
                      <div className="font-bold text-green-400">{depot.nameJa}</div>
                      <div className="text-xs text-slate-400 mt-1">
                        {depotSpecs[depot.depotType].nameJa}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
