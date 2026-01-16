export interface TutorialStep {
  id: string;
  title: string;
  content: string;
  targetElement?: string; // CSS selector
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  action?: 'click' | 'hover' | 'none';
  highlightElement?: boolean;
}

export const tutorialSteps: TutorialStep[] = [
  {
    id: 'welcome',
    title: '🚀 Solar Logistics へようこそ！',
    content: '太陽系全域に広がるコロニーに物資を届ける物流網を構築するゲームです。数理最適化アルゴリズムを使って、効率的なデポ配置を目指しましょう！',
    position: 'center',
    action: 'none',
  },
  {
    id: 'objective',
    title: '🎯 ゲームの目的',
    content: '限られた予算で全コロニーに物資を届け、満足度を維持します。配送達成率、コスト効率、顧客満足度の3つを高めて、総合スコアを最大化しましょう！',
    position: 'center',
    action: 'none',
  },
  {
    id: 'map',
    title: '🌌 太陽系マップ',
    content: 'これが太陽系マップです。青い円がコロニー、緑の四角がデポ（補給基地）を表しています。コロニーをクリックすると詳細情報が見られます。',
    targetElement: '.solar-system-map',
    position: 'right',
    action: 'hover',
    highlightElement: true,
  },
  {
    id: 'score',
    title: '📊 パフォーマンス指標',
    content: '4つの重要な指標を常に確認しましょう。配送達成率が下がると、コロニーの満足度が低下します。',
    targetElement: '.score-board',
    position: 'bottom',
    action: 'none',
    highlightElement: true,
  },
  {
    id: 'budget',
    title: '💰 予算管理',
    content: '現在の予算は10,000クレジットです。デポの建設には予算が必要で、毎月維持費がかかります。収支をバランスよく管理しましょう。',
    targetElement: '.budget-display',
    position: 'bottom',
    action: 'none',
    highlightElement: true,
  },
  {
    id: 'build-depot',
    title: '🏗️ デポを建設',
    content: 'まずはデポを建設してみましょう！このボタンをクリックして、建設メニューを開きます。',
    targetElement: '.build-depot-button',
    position: 'left',
    action: 'click',
    highlightElement: true,
  },
  {
    id: 'select-location',
    title: '📍 建設地点の選択',
    content: 'デポを建設する場所を選びます。火星やケレスなど、コロニーに近い場所が効率的です。まずは火星に建設してみましょう。',
    targetElement: '.build-menu',
    position: 'left',
    action: 'none',
    highlightElement: true,
  },
  {
    id: 'depot-type',
    title: '🏢 デポの種類',
    content: '標準デポは燃料補給機能を持ち、コスト効率が良いです。予算に応じて適切なタイプを選びましょう。',
    targetElement: '.depot-type-select',
    position: 'left',
    action: 'none',
    highlightElement: true,
  },
  {
    id: 'optimize',
    title: '🤖 最適配置の提案',
    content: 'AIが最適なデポ配置を計算してくれます。p-メディアン問題のアルゴリズムを使用して、総輸送コストを最小化します。',
    targetElement: '.optimize-button',
    position: 'left',
    action: 'hover',
    highlightElement: true,
  },
  {
    id: 'next-turn',
    title: '⏭️ ターンを進める',
    content: 'デポを建設したら、このボタンでターンを進めます。1ターン = 1ヶ月で、自動的に物資が配送されます。',
    targetElement: '.next-turn-button',
    position: 'left',
    action: 'hover',
    highlightElement: true,
  },
  {
    id: 'colony-info',
    title: 'ℹ️ コロニー情報',
    content: 'コロニーをクリックすると、人口、満足度、在庫状況が表示されます。在庫が不足すると満足度が下がるので注意しましょう。',
    targetElement: '.colony-info',
    position: 'top',
    action: 'none',
    highlightElement: true,
  },
  {
    id: 'routes',
    title: '🚛 輸送ルート',
    content: 'ターンを進めると、デポからコロニーへの輸送ルートが青い点線で表示されます。輸送船が物資を運んでいるのが見えますよ！',
    targetElement: '.solar-system-map',
    position: 'right',
    action: 'none',
    highlightElement: true,
  },
  {
    id: 'strategy',
    title: '💡 戦略のコツ',
    content: '1. まず内惑星圏（月・火星）にデポを建設\n2. 小惑星帯（ケレス）で中継点を確保\n3. 外惑星系（木星・土星）は需要が少ないので後回しでOK',
    position: 'center',
    action: 'none',
  },
  {
    id: 'complete',
    title: '🎉 準備完了！',
    content: 'チュートリアルは以上です！あとは実際にプレイしながら学んでいきましょう。いつでもヘルプボタンからチュートリアルを再表示できます。頑張ってください！',
    position: 'center',
    action: 'none',
  },
];
