'use client';

import { useState, useEffect } from 'react';
import SolarSystemMap from '@/components/SolarSystemMap';
import Toast, { ToastProps } from '@/components/Toast';
import Tooltip from '@/components/Tooltip';
import Tutorial from '@/components/Tutorial';
import GameResult from '@/components/GameResult';
import DifficultySelector from '@/components/DifficultySelector';
import SaveLoadMenu from '@/components/SaveLoadMenu';
import Statistics from '@/components/Statistics';
import { GameState, Colony, Depot, DepotType, Difficulty } from '@/lib/types';
import { initializeGame, advanceTurn, buildDepot, autoSupply } from '@/lib/gameLogic';
import { buildableSites, depotSpecs } from '@/lib/solarSystemData';
import { generateRecommendedPlacement } from '@/lib/optimizer';
import { tutorialSteps } from '@/lib/tutorialSteps';
import { saveGame, loadGame, getAutoSave } from '@/lib/saveLoad';

export default function Home() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [selectedColony, setSelectedColony] = useState<Colony | null>(null);
  const [selectedDepot, setSelectedDepot] = useState<Depot | null>(null);
  const [showBuildMenu, setShowBuildMenu] = useState(false);
  const [selectedBuildSite, setSelectedBuildSite] = useState<string | null>(null);
  const [selectedDepotType, setSelectedDepotType] = useState<DepotType>('standard');
  const [toast, setToast] = useState<Omit<ToastProps, 'onClose'> | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showDifficultySelector, setShowDifficultySelector] = useState(false);
  const [showSaveLoadMenu, setShowSaveLoadMenu] = useState(false);
  const [showStatistics, setShowStatistics] = useState(false);

  // ゲームを初期化
  useEffect(() => {
    // オートセーブをチェック
    const autoSave = getAutoSave();
    if (autoSave) {
      setGameState(autoSave.gameState);
      setToast({
        message: 'オートセーブデータを読み込みました',
        type: 'info',
      });
    } else {
      // 新規ゲーム開始時は難易度選択を表示
      setShowDifficultySelector(true);
    }

    // チュートリアル完了状態をチェック
    const tutorialCompleted = localStorage.getItem('tutorial_completed');
    if (!tutorialCompleted && !autoSave) {
      // 難易度選択後にチュートリアルを表示するため、ここでは設定しない
    }
  }, []);

  // 難易度選択ハンドラー（早期リターンの前に定義）
  const handleDifficultySelectEarly = (difficulty: Difficulty) => {
    const newGame = initializeGame(difficulty);
    setGameState(newGame);
    setSelectedColony(null);
    setSelectedDepot(null);
    setShowBuildMenu(false);
    setShowDifficultySelector(false);

    // オートセーブ
    saveGame(newGame);

    // チュートリアル完了状態をチェック
    const tutorialCompleted = localStorage.getItem('tutorial_completed');
    if (!tutorialCompleted) {
      setTimeout(() => setShowTutorial(true), 500);
    }

    setToast({
      message: '新しいゲームを開始しました',
      type: 'info',
    });
  };

  if (!gameState) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-4">
        <div className="text-4xl animate-spin-slow">🌍</div>
        <div className="text-white text-xl animate-pulse">太陽系を初期化中...</div>
        <div className="w-64 h-2 bg-slate-800 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 animate-pulse" style={{ width: '60%' }}></div>
        </div>

        {/* 難易度選択（gameStateがnullでも表示） */}
        {showDifficultySelector && (
          <DifficultySelector
            onSelect={handleDifficultySelectEarly}
            onCancel={() => setShowDifficultySelector(false)}
          />
        )}
      </div>
    );
  }

  // ターンを進める
  const handleNextTurn = () => {
    setIsProcessing(true);
    setTimeout(() => {
      const newState = advanceTurn(gameState);
      const suppliedState = autoSupply(newState);
      setGameState(suppliedState);
      setSelectedColony(null);
      setSelectedDepot(null);
      setIsProcessing(false);

      // オートセーブ
      try {
        saveGame(suppliedState);
      } catch (error) {
        console.error('Auto save failed:', error);
      }

      // ゲームオーバーチェック
      if (suppliedState.isGameOver) {
        let message = '';
        switch (suppliedState.gameOverReason) {
          case 'victory':
            message = '🎉 おめでとうございます！勝利条件を達成しました！';
            break;
          case 'bankruptcy':
            message = '💸 予算が枯渇しました。ゲームオーバーです。';
            break;
          case 'all_colonies_lost':
            message = '😢 全コロニーの満足度が壊滅的です。ゲームオーバーです。';
            break;
          case 'max_turns':
            message = '⏰ 10年間の運営が終了しました！';
            break;
        }
        setToast({
          message,
          type: suppliedState.gameOverReason === 'victory' ? 'success' : 'error',
          duration: 5000,
        });
      } else {
        setToast({
          message: `ターン ${suppliedState.currentTurn} が完了しました`,
          type: 'info',
        });
      }
    }, 300);
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
      setToast({
        message: `${site.nameJa}に${spec.nameJa}を建設しました`,
        type: 'success',
      });
    } catch (error) {
      setToast({
        message: error instanceof Error ? error.message : '建設に失敗しました',
        type: 'error',
      });
    }
  };

  // 最適配置の提案
  const handleOptimize = () => {
    setIsProcessing(true);
    setTimeout(() => {
      const result = generateRecommendedPlacement(
        gameState.colonies,
        buildableSites,
        gameState.budget,
        'standard'
      );
      setIsProcessing(false);
      setToast({
        message: `推奨: ${result.sites.map(s => s.nameJa).join(', ')} | カバー率: ${result.evaluation.coverageRate}%`,
        type: 'info',
        duration: 5000,
      });
    }, 500);
  };

  // チュートリアル完了
  const handleTutorialComplete = () => {
    localStorage.setItem('tutorial_completed', 'true');
    setShowTutorial(false);
    setToast({
      message: 'チュートリアル完了！さあ、太陽系の補給線を構築しましょう！',
      type: 'success',
    });
  };

  // チュートリアルスキップ
  const handleTutorialSkip = () => {
    localStorage.setItem('tutorial_completed', 'true');
    setShowTutorial(false);
  };

  // チュートリアルを再表示
  const handleShowTutorial = () => {
    setShowTutorial(true);
  };

  // ゲーム再開
  const handleRestart = () => {
    setShowDifficultySelector(true);
  };

  // 難易度選択
  const handleDifficultySelect = (difficulty: Difficulty) => {
    const newGame = initializeGame(difficulty);
    setGameState(newGame);
    setSelectedColony(null);
    setSelectedDepot(null);
    setShowBuildMenu(false);
    setShowDifficultySelector(false);

    // オートセーブ
    saveGame(newGame);

    // チュートリアル完了状態をチェック
    const tutorialCompleted = localStorage.getItem('tutorial_completed');
    if (!tutorialCompleted) {
      setTimeout(() => setShowTutorial(true), 500);
    }

    setToast({
      message: '新しいゲームを開始しました',
      type: 'info',
    });
  };

  // セーブ/ロードメニューを開く
  const handleOpenSaveLoad = () => {
    setShowSaveLoadMenu(true);
  };

  // セーブデータをロード
  const handleLoadGame = (slotId: string) => {
    const loadedState = loadGame(slotId);
    if (loadedState) {
      setGameState(loadedState);
      setShowSaveLoadMenu(false);
      setToast({
        message: 'ゲームを読み込みました',
        type: 'success',
      });
    } else {
      setToast({
        message: 'セーブデータの読み込みに失敗しました',
        type: 'error',
      });
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white relative overflow-hidden">
      {/* 背景エフェクト */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMxZTI5M2IiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yLjIxIDEuNzktNCAzLjk5OC00SDQwYzIuMjEgMCA0IDEuNzkgNCAzLjk5OFY0MGMwIDIuMjEtMS43OSA0LTMuOTk4IDRINDBWNDZ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-20"></div>

      {/* ヘッダー */}
      <div className="relative glass-effect-strong border-b border-slate-700/50 shadow-xl animate-slide-in-down">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="animate-slide-in-left">
              <h1 className="text-3xl font-bold text-gradient-rainbow animate-float">
                Solar Logistics
              </h1>
              <p className="text-sm text-slate-400 mt-1">太陽系補給線マネジメント</p>
            </div>
            <div className="flex items-center gap-3 sm:gap-4 text-sm animate-slide-in-right">
              <Tooltip content="セーブ/ロード" position="bottom">
                <button
                  onClick={handleOpenSaveLoad}
                  className="button-enhanced px-3 py-2 glass-effect hover-glow rounded-lg text-lg"
                >
                  💾
                </button>
              </Tooltip>
              <Tooltip content="統計情報を表示" position="bottom">
                <button
                  onClick={() => setShowStatistics(true)}
                  className="button-enhanced px-3 py-2 glass-effect hover-glow rounded-lg text-lg"
                >
                  📊
                </button>
              </Tooltip>
              <Tooltip content="チュートリアルを表示" position="bottom">
                <button
                  onClick={handleShowTutorial}
                  className="button-enhanced px-3 py-2 glass-effect hover-glow rounded-lg text-lg"
                >
                  ❓
                </button>
              </Tooltip>
              <div className="hidden sm:block h-8 w-px bg-slate-700"></div>
              <div className="hidden md:flex items-center gap-3">
                <div className="glass-effect px-4 py-2 rounded-lg border border-blue-500/30">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-blue-400">🌍</span>
                    <div className="flex flex-col">
                      <span className="text-xs text-slate-400">ゲーム内日時</span>
                      <span className="font-mono text-gradient-blue font-bold text-sm">
                        {gameState.year}年 {gameState.month}月{Math.floor((gameState.epoch % 30) + 1)}日
                      </span>
                    </div>
                  </div>
                </div>
                <div className="glass-effect px-3 py-2 rounded-lg">
                  <span className="text-slate-400 text-xs">ターン:</span>{' '}
                  <span className="font-mono text-white font-bold">{gameState.currentTurn}</span>
                </div>
                <div className="glass-effect px-3 py-2 rounded-lg">
                  <span className="text-slate-400 text-xs">予算:</span>{' '}
                  <span className={`font-mono font-bold ${gameState.budget > 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {gameState.budget.toLocaleString()} cr
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* 左カラム: マップ */}
          <div className="lg:col-span-2 space-y-4">
            {/* スコアボード */}
            <div className="score-board card-enhanced rounded-xl p-4 sm:p-5 animate-slide-in-left">
              <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 text-gradient-blue">パフォーマンス指標</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
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
            <div className="card-enhanced rounded-xl p-4 animate-slide-in-left" style={{ animationDelay: '0.1s' }}>
              <div className="solar-system-map aspect-square">
                <SolarSystemMap
                  colonies={gameState.colonies}
                  depots={gameState.depots}
                  routes={gameState.routes}
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
            <div className="budget-display card-enhanced rounded-xl p-4 animate-slide-in-right">
              <h2 className="text-lg font-bold mb-3 text-gradient-purple">今月の収支</h2>
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
            <div className="card-enhanced rounded-xl p-4 animate-slide-in-right" style={{ animationDelay: '0.1s' }}>
              <h2 className="text-lg font-bold mb-3 text-gradient-blue">アクション</h2>
              <div className="space-y-3">
                {/* 時間加速コントロール */}
                <div className="glass-effect rounded-lg p-3 border border-slate-600/30">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-slate-400">時間加速</span>
                    <span className="text-sm font-mono font-bold text-blue-400">x{gameState.timeScale}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[1, 10, 100].map(scale => (
                      <button
                        key={scale}
                        onClick={() => setGameState({ ...gameState, timeScale: scale })}
                        className={`px-3 py-2 rounded-lg font-mono font-bold text-sm transition-all ${
                          gameState.timeScale === scale
                            ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/50'
                            : 'bg-slate-700/50 text-slate-400 hover:bg-slate-600/50'
                        }`}
                      >
                        x{scale}
                      </button>
                    ))}
                  </div>
                </div>

                <Tooltip content="時間を進めて物資を自動配送します" position="left">
                  <button
                    onClick={handleNextTurn}
                    disabled={isProcessing}
                    className="button-enhanced next-turn-button w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 disabled:from-slate-700 disabled:to-slate-700 disabled:cursor-not-allowed text-white font-bold py-4 px-4 rounded-xl shadow-lg hover:shadow-xl hover:shadow-blue-500/50 transition-all duration-300 hover:scale-105 active:scale-95"
                  >
                    {isProcessing ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="animate-spin">⏳</span>
                        処理中...
                      </span>
                    ) : (
                      '次のターンへ ▶'
                    )}
                  </button>
                </Tooltip>
                <Tooltip content="新しいデポを建設します" position="left">
                  <button
                    onClick={() => setShowBuildMenu(!showBuildMenu)}
                    disabled={isProcessing}
                    className="button-enhanced build-depot-button w-full bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-700 hover:to-emerald-600 disabled:from-slate-700 disabled:to-slate-700 disabled:cursor-not-allowed text-white font-bold py-4 px-4 rounded-xl shadow-lg hover:shadow-xl hover:shadow-green-500/50 transition-all duration-300 hover:scale-105 active:scale-95"
                  >
                    🏗️ デポを建設
                  </button>
                </Tooltip>
                <Tooltip content="AIが最適なデポ配置を計算します" position="left">
                  <button
                    onClick={handleOptimize}
                    disabled={isProcessing}
                    className="button-enhanced optimize-button w-full bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 disabled:from-slate-700 disabled:to-slate-700 disabled:cursor-not-allowed text-white font-bold py-4 px-4 rounded-xl shadow-lg hover:shadow-xl hover:shadow-purple-500/50 transition-all duration-300 hover:scale-105 active:scale-95"
                  >
                    {isProcessing ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="animate-spin">🔄</span>
                        計算中...
                      </span>
                    ) : (
                      '🤖 最適配置を提案'
                    )}
                  </button>
                </Tooltip>
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

      {/* トースト通知 */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onClose={() => setToast(null)}
        />
      )}

      {/* チュートリアル */}
      {showTutorial && (
        <Tutorial
          steps={tutorialSteps}
          onComplete={handleTutorialComplete}
          onSkip={handleTutorialSkip}
        />
      )}

      {/* ゲーム終了画面 */}
      {gameState.isGameOver && (
        <GameResult
          gameState={gameState}
          onRestart={handleRestart}
        />
      )}

      {/* 難易度選択 */}
      {showDifficultySelector && (
        <DifficultySelector
          onSelect={handleDifficultySelect}
          onCancel={() => setShowDifficultySelector(false)}
        />
      )}

      {/* セーブ/ロードメニュー */}
      {showSaveLoadMenu && (
        <SaveLoadMenu
          onLoad={handleLoadGame}
          onClose={() => setShowSaveLoadMenu(false)}
        />
      )}

      {/* 統計画面 */}
      {showStatistics && (
        <Statistics
          gameState={gameState}
          onClose={() => setShowStatistics(false)}
        />
      )}
    </main>
  );
}
