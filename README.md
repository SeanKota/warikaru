# warikaru (割軽)

> **AIの計算ミスを防ぐ、高信頼な決定論的割り勘・精算エンジン**  
> AIエージェント向け規格（`llm.txt` / API Routes）× TypeScript高精度計算エンジン × 人間用モダンWeb UI

[![Next.js](https://img.shields.io/badge/Next.js-16_App_Router-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38bdf8?logo=tailwindcss)](https://tailwindcss.com/)
[![Vercel Ready](https://img.shields.io/badge/Deploy-Vercel-000?logo=vercel)](https://vercel.com/)

---

## 💡 プロジェクトの背景・目的

大規模言語モデル（Claude, ChatGPT, Gemini等）は自然言語からの状況整理や条件抽出には優れているものの、**多人数間の割り勘計算、複雑な傾斜配分、端数処理、およびグラフ理論に基づく最小送金回数の最適化**において、高頻度で暗算ミスや不整合（ハルシネーション）を発生させます。

**warikaru** は、以下の役割分担によって「計算ミスゼロの割り勘体験」を実現します：

1. **AIの役割**: 自然言語の文脈理解（誰が何をいくら払ったか、誰が遅刻したか、比率の把握など）
2. **warikaru Engine (TypeScript) の役割**: 厳密な按分計算、端数調停（合計が厳密に一致することを数学的に証明）、最小送金回数の最適化
3. **人間用インタラクティブUI**: ブラウザで直感的に操作・確認でき、LINE/SlackやAIプロンプトへ1タップ共有

---

## 🛠 技術スタック

- **Framework**: Next.js 16 (App Router / React 19)
- **Language**: TypeScript (Strict Mode)
- **Styling**: Tailwind CSS v4, Lucide React (Icons)
- **Design System**: 白とインディゴ・ブルー基調のクリーン・信頼感あふれるモダンUI
- **Deployment**: Vercel (Edge / Serverless 対応)

---

## 📂 主要機能とファイル構造

```
warikaru/
├── public/
│   └── llm.txt                 # AIエージェント向け規格仕様書 (Plain Text)
├── app/
│   ├── api/
│   │   └── calculate/
│   │       └── route.ts        # 精算計算APIエンドポイント (POST /api/calculate, CORS対応)
│   ├── layout.tsx              # ルートレイアウト・メタデータ
│   ├── page.tsx                # 人間用インタラクティブWeb UI
│   └── globals.css             # Tailwind CSS スタイルシート
├── lib/
│   ├── types.ts                # TypeScript型定義 (Request, Response, Condition, etc.)
│   ├── calculate.ts            # 精算計算エンジン（貪欲法・完全一致ヒューリスティックによる最小送金回数アルゴリズム）
│   ├── presets.ts              # デモ用プリセットデータ（飲み会、ドライブ旅行、BBQ等）
│   └── utils.ts                # フォーマット・スタイリングユーティリティ
└── components/
    ├── Header.tsx              # ヘッダー（ロゴ、プリセット選択、llm.txtモーダル）
    ├── FeatureBanner.tsx       # AI × 計算エンジン ハイブリッド解説バナー
    ├── MemberManager.tsx       # メンバー動的追加・削除
    ├── PaymentManager.tsx      # 立替・支払い管理（個別参加トグル対応）
    ├── ConditionManager.tsx    # 柔軟な条件設定（除外・比率/重み・固定割引）
    ├── RoundingManager.tsx     # 端数丸め設定（1円、10円、100円、1000円）
    ├── ResultDisplay.tsx       # 最小送金リスト、数学的整合性検証、共有ボタン
    ├── BreakdownTable.tsx      # 計算根拠・詳細内訳テーブル
    └── LlmSpecModal.tsx        # llm.txt 仕様書＆APIドキュメントモーダル
```

---

## 🤖 1. AIエージェント向け仕様ファイル (`/public/llm.txt`)

Claude, ChatGPT, MCP (Model Context Protocol) ツール等がアクセスした際に、一瞬で計算APIの呼び出し方と仕様を把握できるプレーンテキスト仕様書です。

- **URL**: `https://<domain>/llm.txt`
- **内容**:
  - アプリの目的とアーキテクチャ
  - POST `/api/calculate` の完全なJSONスキーマ
  - 条件設定（exclude, weight, fixed_discount）の仕様
  - 最小送金回数アルゴリズム（グラフ理論）の説明
  - AIシステムプロンプトの指示文・Function Calling例

---

## ⚡ 2. 精算計算APIエンドポイント (`POST /api/calculate`)

### リクエスト例:
```json
{
  "members": ["Aさん", "Bさん", "Cさん"],
  "payments": [
    { "paidBy": "Aさん", "amount": 12000, "description": "一次会（居酒屋）" },
    { "paidBy": "Bさん", "amount": 3000, "description": "タクシー代" }
  ],
  "conditions": [
    { "type": "exclude", "member": "Cさん", "description": "タクシー乗っていないためタクシー代から除外" },
    { "type": "weight", "member": "Aさん", "weight": 1.5, "description": "幹事のため1.5倍" },
    { "type": "fixed_discount", "member": "Cさん", "amount": 1000, "description": "遅刻のため1,000円引" }
  ],
  "options": {
    "roundingUnit": 100,
    "roundingMode": "round"
  }
}
```

### レスポンス例:
```json
{
  "success": true,
  "transfers": [
    { "from": "Cさん", "to": "Aさん", "amount": 2400 },
    { "from": "Bさん", "to": "Aさん", "amount": 2100 }
  ],
  "breakdown": [
    {
      "member": "Aさん",
      "paid": 12000,
      "share": 7500,
      "net": 4500,
      "rawShare": 7442.86,
      "paymentDetails": [ ... ],
      "appliedConditions": [ "[一次会（居酒屋）] 比率: 1.5倍 (幹事のため1.5倍)" ]
    },
    ...
  ],
  "verification": {
    "totalPaid": 15000,
    "totalShare": 15000,
    "sumNetBalance": 0,
    "totalTransferAmount": 4500,
    "transferCount": 2,
    "isBalanced": true,
    "isComplete": true,
    "algorithm": "Greedy Minimum Cash Flow with Exact-Match Heuristic"
  }
}
```

---

## 🧮 3. 最小送金回数アルゴリズムの仕組み

$N$ 人のメンバー間で素朴に精算を行うと、最大 $\frac{N(N-1)}{2}$ 回の送金が発生する恐れがあります。  
warikaru は以下の2段階最適化を行い、**高々 $N-1$ 回以内（多くはさらに少ない回数）**に圧縮します：

1. **Exact-Match Heuristic（完全一致ペアの即時相殺）**:
   - ある債務者の支払額とある債権者の受取額が完全に一致する場合、直接1回の送金で両者をゼロに解消。
2. **Greedy Cash Flow Optimization（貪欲マッチング）**:
   - 残った債務者（最大額）と債権者（最大額）をマッチングし、$\min(\text{credit}, \text{debt})$ を送金。
   - いずれかの残高が0になり、全員の残高が解消されるまで反復。

---

## 🚀 開発・起動手順

```bash
# 依存関係のインストール
npm install

# 開発サーバー起動
npm run dev

# プロダクションビルド & 起動
npm run build
npm run start
```

ブラウザで `http://localhost:3000` を開きます。

---

## 🚢 Vercel へのデプロイ

リポジトリを GitHub に push し、Vercel ダッシュボードから「Import Project」を行うだけで即座にデプロイ完了します。
特別な環境変数は不要です。
