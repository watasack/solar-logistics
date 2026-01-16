# 開発ガイド

## プロジェクト概要

Solar Logisticsは、太陽系を舞台にした拠点最適化シミュレーションゲームです。数理最適化のアルゴリズムを使用して、効率的な物流網を構築することが目的です。

## 開発環境のセットアップ

### 必要な環境
- Node.js 18.x 以降
- npm または yarn
- Git

### インストール手順

```bash
# プロジェクトをクローン
git clone https://github.com/yourusername/solar-logistics.git
cd solar-logistics

# 依存関係をインストール
npm install

# 開発サーバーを起動
npm run dev
```

開発サーバーは http://localhost:3000 で起動します。

## プロジェクト構成

### ディレクトリ構造

```
solar-logistics/
├── app/                      # Next.js App Router
│   ├── page.tsx             # メインゲーム画面
│   ├── layout.tsx           # ルートレイアウト
│   └── globals.css          # グローバルスタイル
├── components/              # React コンポーネント
│   └── SolarSystemMap.tsx   # 太陽系マップの描画
├── lib/                     # ビジネスロジック
│   ├── types.ts            # TypeScript型定義
│   ├── solarSystemData.ts  # 太陽系の静的データ
│   ├── optimizer.ts        # 最適化アルゴリズム
│   └── gameLogic.ts        # ゲームのコアロジック
└── public/                  # 静的アセット
```

### 主要ファイルの説明

#### [lib/types.ts](lib/types.ts)
すべての型定義を含むファイル。以下の主要な型を定義：
- `CelestialBody`: 天体の基本型
- `Colony`: コロニー（需要地）
- `Depot`: デポ（補給拠点）
- `GameState`: ゲーム全体の状態
- `Route`: 輸送ルート

#### [lib/optimizer.ts](lib/optimizer.ts)
最適化アルゴリズムを実装：
- `calculateDistance()`: 2天体間の距離計算（余弦定理）
- `greedyFacilityLocation()`: 貪欲法による施設配置
- `pMedianOptimization()`: p-メディアン問題の交換法
- `evaluatePlacement()`: 配置案の評価

#### [lib/gameLogic.ts](lib/gameLogic.ts)
ゲームのコアロジック：
- `initializeGame()`: ゲーム初期化
- `advanceTurn()`: ターン進行
- `buildDepot()`: デポ建設
- `autoSupply()`: 自動補給システム

#### [components/SolarSystemMap.tsx](components/SolarSystemMap.tsx)
SVGを使用した太陽系マップの描画コンポーネント。
- 惑星の軌道表示
- コロニーとデポの表示
- 接続線の描画
- クリックイベント処理

## 開発のポイント

### 状態管理
現在は React の `useState` を使用したシンプルな状態管理を採用しています。将来的により複雑な状態管理が必要になった場合は、Zustand や Redux の導入を検討してください。

### 最適化アルゴリズム

#### 1. 距離計算
```typescript
// 余弦定理: c² = a² + b² - 2ab*cos(C)
const distanceAU = Math.sqrt(
  r1 * r1 + r2 * r2 - 2 * r1 * r2 * Math.cos(angleDiff)
);
```

#### 2. 貪欲法
各ステップで最も多くのコロニーをカバーできる地点を選択する近似アルゴリズム。時間計算量: O(p × n × m)
- p: 建設するデポ数
- n: 候補地点数
- m: コロニー数

#### 3. p-メディアン問題の交換法
初期解を貪欲法で生成し、反復的に改善していく手法。局所最適解を求める。

## 機能の追加方法

### 新しいコロニーを追加

[lib/solarSystemData.ts](lib/solarSystemData.ts) の `initialColonies` 配列に追加：

```typescript
{
  ...celestialBodies.newLocation,
  population: 10000,
  demand: {
    life_support: 50,
    fuel: 30,
    materials: 40,
    equipment: 25,
  },
  inventory: { /* ... */ },
  satisfaction: 70,
}
```

### 新しいデポタイプを追加

[lib/solarSystemData.ts](lib/solarSystemData.ts) の `depotSpecs` に追加：

```typescript
newType: {
  type: 'newType',
  name: 'New Depot Type',
  nameJa: '新型デポ',
  constructionCost: 2000,
  maintenanceCost: 80,
  capacity: 3000,
  description: '説明',
  specialAbility: 'custom_ability',
}
```

### イベントシステムの追加

1. [lib/types.ts](lib/types.ts) に `GameEvent` 型を既に定義済み
2. [lib/gameLogic.ts](lib/gameLogic.ts) にイベント処理ロジックを追加
3. UI に通知コンポーネントを追加

## テスト

現在、テストは未実装です。以下のテスト戦略を推奨します：

### 単体テスト
- Jest + React Testing Library
- 最適化アルゴリズムのテスト
- ゲームロジックのテスト

```bash
# テストの実行（未実装）
npm test
```

### E2Eテスト
- Playwright または Cypress
- ユーザーフローのテスト

## パフォーマンス最適化

### 現在の最適化
- Next.js の自動コード分割
- Turbopack による高速ビルド
- クライアントサイドレンダリング（CSR）

### 今後の最適化案
1. **Web Workers**: 重い計算処理を別スレッドで実行
2. **メモ化**: `useMemo` や `React.memo` でレンダリング最適化
3. **仮想化**: 大量のデータ表示時に react-window を使用
4. **SSR**: 初期表示の高速化

## デプロイ

### Vercel へのデプロイ

1. GitHubにプッシュ
```bash
git add .
git commit -m "feat: implement feature"
git push origin main
```

2. Vercel と GitHub を連携（初回のみ）
3. 自動デプロイが実行される

### 環境変数

必要に応じて `.env.local` を作成：
```bash
# 例: 将来的にAPIを使用する場合
NEXT_PUBLIC_API_URL=https://api.example.com
```

## コーディング規約

### TypeScript
- 型は可能な限り明示的に定義
- `any` の使用は避ける
- インターフェースよりも型エイリアスを優先

### React
- 関数コンポーネントを使用
- カスタムフックで共通ロジックを抽出
- コンポーネントは単一責任の原則に従う

### CSS
- Tailwind CSS のユーティリティクラスを使用
- カスタムCSSは最小限に

### ファイル命名
- コンポーネント: PascalCase (例: `SolarSystemMap.tsx`)
- ユーティリティ: camelCase (例: `optimizer.ts`)
- 定数: UPPER_SNAKE_CASE

## トラブルシューティング

### ビルドエラー
```bash
# node_modulesを削除して再インストール
rm -rf node_modules
npm install
```

### 型エラー
```bash
# 型定義を再生成
npm run build
```

### 開発サーバーが起動しない
```bash
# ポートが使用中の場合、別のポートで起動
PORT=3001 npm run dev
```

## 参考資料

### アルゴリズム
- Drezner, Z., & Hamacher, H. W. (2002). Facility location: applications and theory.
- Daskin, M. S. (2011). Network and discrete location: models, algorithms, and applications.

### 太陽系データ
- NASA JPL Horizons System: https://ssd.jpl.nasa.gov/horizons/
- Planetary Fact Sheet: https://nssdc.gsfc.nasa.gov/planetary/factsheet/

### Next.js
- Next.js Documentation: https://nextjs.org/docs
- React Documentation: https://react.dev

## ライセンス

MIT License

## お問い合わせ

質問や提案がある場合は、GitHubのIssueを作成してください。
