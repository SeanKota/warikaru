# warikaru (割軽)

> **最小の送金回数でスッキリ割り勘・精算**  
> AIの計算ミス（ハルシネーション）を防ぐ GETファーストな精算エンジン × モダンWeb UI

[![Next.js](https://img.shields.io/badge/Next.js-16_App_Router-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38bdf8?logo=tailwindcss)](https://tailwindcss.com/)
[![Vercel Ready](https://img.shields.io/badge/Deploy-Vercel-000?logo=vercel)](https://vercel.com/)

---

## 💡 プロジェクトの背景：なぜ「GETファースト」なのか？

### 1. LLMの計算ミスとPOSTの限界
ChatGPTやGeminiなどのLLMは、複数人の割り勘・傾斜配分・端数調整・送金回数の最適化において暗算ミスを高頻度で起こします。  
しかし、**ChatGPT等のWebブラウジング機能は HTTP POST リクエストを送信できません（GETのみ対応）**。そのため、従来の「POST API」を用意しても、チャットAIのブラウジングツールからは呼び出せずエラーになっていました。

### 2. warikaru の解決策（GET-First & Web Browsing 最適化）
warikaru は、**URLクエリパラメータ（GET）のみで全条件を受け付け、HTML結果画面（`/result`）を瞬時に返す設計**を採用しています。

1. **AIの役割**: 自然言語から条件を抽出し、公式URL（`GET /result?...`）を組み立ててWeb閲覧ツールで開く。
2. **warikaru の役割**: 厳密なアルゴリズムで計算し、確定結果をHTMLで描画。
3. **人間への還元**: AIの回答末尾に「確定結果画面のURL」が添えられるため、ユーザーはChatGPTの外でも1タップで確認・微調整できる。

---

## 🛠 技術スタック

- **Framework**: Next.js 16 (App Router / React 19)
- **Language**: TypeScript (Strict Mode)
- **Styling**: Tailwind CSS v4, Lucide React (Icons)
- **Architecture**: GET-First SSR（サーバーサイドレンダリング） + クライアント即時計算
- **Deployment**: Vercel

---

## 📂 ディレクトリ構成

```
warikaru/
├── public/
│   └── llm.txt                 # AI向け規格仕様書 (GETパラメータ組み立て仕様)
├── app/
│   ├── api/
│   │   └── calculate/
│   │       └── route.ts        # GET / POST 両対応 計算API
│   ├── result/
│   │   └── page.tsx            # AIブラウジング & 共有用 HTML結果ページ
│   ├── layout.tsx              # ルートレイアウト・メタデータ
│   ├── page.tsx                # インタラクティブWeb UI (URL復元対応)
│   └── globals.css             # Tailwind CSS
├── lib/
│   ├── types.ts                # 型定義 (Request, Response, Condition, etc.)
│   ├── calculate.ts            # 精算計算エンジン（貪欲法・完全一致ヒューリスティック）
│   ├── queryParser.ts          # URLクエリ解析（過剰エンコード安全デコード対応）
│   ├── presets.ts              # サンプルデータ（飲み会、ドライブ旅行、BBQ等）
│   └── utils.ts                # 通貨フォーマット等ユーティリティ
└── components/
    ├── Header.tsx              # ヘッダー（ロゴ、サンプル選択）
    ├── MemberManager.tsx       # メンバー管理
    ├── PaymentManager.tsx      # 立替・支払い管理（個別参加トグル）
    ├── ConditionManager.tsx    # 条件設定（比率・除外・固定割引）
    ├── RoundingManager.tsx     # 端数丸め設定（1円、10円、100円、1000円）
    ├── ResultDisplay.tsx       # 送金リスト、LINE/Slackコピー、共有URLコピー
    ├── BreakdownTable.tsx      # 各自の負担内訳テーブル
    └── LlmSpecModal.tsx        # API仕様書モーダル
```

---

## 🤖 AI（ChatGPT / Gemini）からの利用方法

プロンプトに `https://warikaru.vercel.app/llm.txt` のURLを含めて依頼するだけで、AIが仕様を読み込み、公式結果URLを組み立てて確定精算を行います。

### プロンプト例:
```text
https://warikaru.vercel.app/llm.txt
このURLの仕様書をWebブラウジングして読み込んで、以下の割り勘を計算してください！

【支払いのメモ】
・Aさんが居酒屋 12,000円を立替
・Bさんがタクシー 3,000円を立替
・参加者はAさん、Bさん、Cさんの3人
・Cさんはタクシーに乗っていないため除外
・Aさんは上司なので1.5倍負担
・Cさんは遅刻したため1,000円引き
・100円単位で丸め

最小送金リスト、各自の内訳、LINE用メッセージ、そして【計算結果画面へのリンク】を出力してください！
```

AIは仕様書に基づき以下のURLを組み立ててWeb閲覧し、正確な数値を返します：
```
https://warikaru.vercel.app/result?members=A,B,C&payments=A:12000:居酒屋,B:3000:タクシー&exclude=C:タクシー&weight=A:1.5&discount=C:1000&unit=100
```

---

## ⚡ エンドポイント仕様

### 1. 結果確認・AIブラウジング用（推奨・GET）
`GET /result?members=...&payments=...`

- **用途**: ChatGPT等のWeb閲覧ツール、または人間がLINE等からリンクを開く場合
- **形式**: レスポンシブHTML（送金リスト、内訳、LINE用テキスト、「アプリで微調整」ボタン）

### 2. 軽量テキスト・JSON API（GET）
`GET /api/calculate?members=...&format=text` または `format=json`

- ブラウザでそのまま開いた場合は自動的に `/result` へリダイレクトされます。
- `format=text` を指定するとプレーンテキストで計算結果を返します。

### 3. プログラム連携用 API（POST）
`POST /api/calculate` (Content-Type: `application/json`)

- **用途**: curl や外部バックエンドプログラムからの直接呼び出し（※ チャットAIのWebブラウジングでは使用不可）
- リクエスト例:
```json
{
  "members": ["A", "B", "C"],
  "payments": [
    { "paidBy": "A", "amount": 12000, "description": "居酒屋" },
    { "paidBy": "B", "amount": 3000, "description": "タクシー" }
  ],
  "conditions": [
    { "type": "exclude", "member": "C", "paymentDescription": "タクシー" },
    { "type": "weight", "member": "A", "weight": 1.5 },
    { "type": "fixed_discount", "member": "C", "amount": 1000 }
  ],
  "options": {
    "roundingUnit": 100,
    "roundingMode": "round"
  }
}
```

---

## 🧮 最小送金回数アルゴリズム

全員の貸し借りを整理し、**最小の送金回数（高々 $N-1$ 回以内）**に圧縮します。

1. **Exact-Match Heuristic（完全一致相殺）**:  
   支払うべき金額と受け取るべき金額が完全に一致するペアを見つけ、1回の直接送金で即座に清算。
2. **Greedy Cash Flow Optimization（最大残高マッチング）**:  
   最大の債務者と最大の債権者をマッチングし、$\min(\text{credit}, \text{debt})$ を送金。全員の残高がゼロになるまで反復。
3. **端数補正（Zero-Sum 保証）**:  
   丸め処理によって発生する端数のズレを、設定されたターゲット（最高負担者等）に自動集約し、全体の差額合計が厳密に $\pm 0$ 円となるよう整合性を保持。

---

## 🚀 ローカル起動手順

```bash
# 依存関係のインストール
npm install

# 開発サーバー起動
npm run dev

# プロダクションビルド
npm run build
npm run start
```

ブラウザで `http://localhost:3000` を開きます。
