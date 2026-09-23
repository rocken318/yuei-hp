# 遊栄JAPAN コーポレートサイト 設計書

- 作成日: 2026-09-23
- リポジトリ: https://github.com/rocken318/yuei-hp
- ステータス: 設計承認済み（実装計画待ち）

## 0. スコープ

本設計の対象は **遊栄JAPANコーポレートサイト（店舗紹介ページ含む）** のみ。
各店舗の独立ブランドサイトは後続の別プロジェクト（個別に spec → plan → 実装）とし、本サイトの店舗ページからリンクする枠だけを用意する。

### 目的の優先順位
1. **A. 企業ブランディング・信頼獲得**（取引先・金融機関・行政向け）
2. **B. BtoB集客・問い合わせ**（遊栄ビジョン広告枠、Web制作受注）
3. **C. 採用**

### 事業と店舗
| 事業 | 店舗・拠点 |
|---|---|
| ナイトエンターテインメント事業（キャバクラ事業） | KINGYO / B-club / C-girl |
| 飲食事業 | 焼肉En / ダイニングバー暖家 |
| デジタルサイネージ事業「遊栄ビジョン」 | 千松島ビル / ピースビル / エーラクビル / 晩翠通り（仙台・国分町） |
| Web開発・コンテンツ制作事業 | — |

## 1. 技術構成

- Next.js（App Router）+ TypeScript、全ページSSG
- Tailwind CSS v4 + shadcn/ui（21st.dev コンポーネント前提）
- Motion（旧 framer-motion）、Lenis（スムーススクロール）
- next/image（AVIF/WebP、サイズ最適化）
- ホスティング: Vercel（main=本番、PRごとにプレビュー）。ドメインは後日追加、当面は Vercel の仮URL
- CMS: 現時点では導入しない。コンテンツをデータ層として分離し、将来ヘッドレスCMS（microCMS/Sanity等）へ差し替え可能にする

### リポジトリ構成
```
yuei-hp/
├─ AGENTS.md            Claude/Codex 共通規約
├─ CLAUDE.md            AGENTS.md を参照するのみ
├─ app/                 ページ
├─ components/
│   ├─ ui/              shadcn 基本部品
│   ├─ effects/         21st.dev 由来エフェクト（1ファイル1エフェクト、冒頭に取込元URL）
│   └─ sections/        ページセクション
├─ content/             事業・店舗・お知らせ・採用データ
├─ lib/content.ts       データ取得の唯一の入口（CMS移行時はここだけ差し替え）
├─ assets-pipeline/
│   ├─ briefs/          画像ブリーフ JSON（_style.json = 共通スタイル）
│   ├─ tasks/           Codex へのコード変更依頼書
│   ├─ manifest.json    生成画像の来歴
│   └─ scripts/         codex exec 呼び出し・画像最適化
├─ public/images/
│   ├─ source/          提供実写を最適化したもの
│   └─ generated/       Codex 生成画像（採用版を最適化したもの）
└─ docs/superpowers/specs/
```

- 原本写真 `images/`（約134MB）は **Git管理外**。スクリプトでリサイズ・変換した成果物のみ `public/images/source/` にコミットする。
- ロゴ原本は `images/kingyo-bclublogo/*.ai`（YUEI / KINGYO / B-CLUB）。SVG化して使用する。

## 2. サイトマップ

```
/                                   トップ
/about                              会社概要（代表挨拶・理念・沿革・会社情報・アクセス）
/business                           事業一覧
/business/nightlife                 ナイトエンターテインメント事業
/business/nightlife/kingyo
/business/nightlife/b-club
/business/nightlife/c-girl
/business/dining                    飲食事業
/business/dining/en
/business/dining/danke
/business/signage                   遊栄ビジョン
/business/signage/chimatsushima     千松島ビル
/business/signage/peace             ピースビル
/business/signage/eiraku            エーラクビル
/business/signage/bansui            晩翠通り
/business/digital                   Web開発・コンテンツ制作（サービス・制作フロー・実績）
/news, /news/[slug]                 お知らせ
/recruit                            採用（職種一覧。店舗別募集は店舗サイトへリンク）
/contact                            お問い合わせ（種別: サイネージ広告 / Web制作 / 取材・その他）
/privacy                            プライバシーポリシー
```

- 事業ページ・店舗ページは共通テンプレート + `content/` のデータで生成する。店舗ページには将来の店舗サイトURL枠を持つ。
- 年齢確認ゲートはコーポレートサイトには設けない（店舗サイト側で対応）。

### トップページ構成
1. ヒーロー: ロゴの四角ピースが舞い上がり柱へ集まるアニメーション + キャッチコピー + 青系メッシュグラデーション
2. 企業メッセージ: スクロール連動の文字リビール
3. 4事業: 大型の傾きカード（ホバーで写真が動く）
4. 遊栄ビジョン: 国分町マップ上の4拠点、広告枠問い合わせCTA
5. Web・コンテンツ制作: 実績とサービス導線
6. 数字で見る遊栄JAPAN: カウントアップ
7. お知らせ / 採用バナー / お問い合わせCTA

## 3. Claude × Codex 連携

基本方針: **Claude が指揮・実装・レビュー・デプロイを担い、Codex は画像生成を担当**。必要に応じて Codex がコードを変更することも許容する（3-2のルールに従う）。

Codex CLI（v0.154.0、`image_generation` 機能 stable/有効）を Claude が Bash から `codex exec` で呼び出す。

### 3-1. 画像生成フロー（通常）
1. Claude がブリーフを作成: `assets-pipeline/briefs/<id>.json`
   `{ id, purpose, page, aspect, size, prompt, negative, style_ref, variants }`（既定 variants: 3）
2. `scripts/gen` が `_style.json`（共通スタイル）を合成し、`codex exec` をバックグラウンドで実行（並列可）。
   Codex への指示は「ブリーフ通りに生成し `generated/<id>/v1..vN.png` に保存。コードには触れない」。
3. Claude が候補を目視確認 → 採用版を `manifest.json` に記録（ブリーフハッシュ・日時・採用案）→ sharp で AVIF/WebP 化して `public/images/generated/` へ。
4. 不採用なら prompt を修正して 2 から再実行。
5. ムードボード・ヒーロー画像など重要画像は、候補をブラウザで並べてユーザーが最終選択する。

`_style.json` の共通スタイル: ホワイトベース、ロゴの青グラデーション、クリーンな光の質感、仙台・国分町の空気感、人物テイストの統一。

### 3-2. Codex によるコード変更（例外フロー）
- 発動条件: Claude が Codex の方が適すると判断した場合、またはユーザーの指示。
- ルール:
  1. Codex は必ず `codex/<task>` ブランチ（git worktree）で作業し、main へ直接触れない。
  2. 依頼書 `assets-pipeline/tasks/<id>.md` に変更可能範囲（ファイル）と完了条件を明記する。
  3. Codex も `AGENTS.md` の規約に従う（部品配置、デザイントークン使用、データ取得は `lib/content.ts` 経由 等）。
  4. 完了後、Claude が差分レビュー → lint / typecheck / build 通過 → Vercel プレビューで目視確認 → main へマージ。
- Claude 自身の作業もブランチ → PR → プレビュー確認 → マージに揃え、実装者によらず同じ関門を通す。

### 3-3. 21st.dev コンポーネント取り込み
MCP で検索 → 試用 → `components/effects/` に1ファイル単位で取り込み → デザイントークン（色・角丸・フォント）に合わせて調整。取込元URLをファイル冒頭コメントに記載。

## 4. デザインシステム

世界観: **ホワイト基調のクリーン系**。夜の店舗写真は白地上にフレームで切り取りギャラリー的に配置し、店舗ページのヒーローのみ写真全面で店の空気を出す。

- 色: ベース #FFFFFF / #F6F8FB、文字 #231815（ロゴの墨色）、アクセントはロゴのグラデーションに合わせ ネイビー #000F50 → ブルー #0D3192 → スカイ #B8DDF3
- フォント: 日本語本文 Noto Sans JP、日本語見出し Zen Kaku Gothic New、欧文見出し Space Grotesk 系（ロゴの幾何学的イメージに合わせる）
- モーション: イージングと時間は3種類に限定して統一する

### ロゴ
現ロゴ（柱＋舞い上がる四角ピース）のモチーフを維持し洗練させる方針。
- 制作中は既存 `.ai` から SVG 化したものを使用。
- 並行して Codex でリファイン案を作成し、決定後に差し替え。

### エフェクト割り当て
| 場所 | エフェクト |
|---|---|
| ヒーロー | ロゴのピースが集まるアニメーション（自作）+ メッシュグラデーション |
| 見出し | テキストリビール / スプリットテキスト |
| 事業カード | 3D Tilt / Spotlight |
| 実績・店舗写真 | 無限マーキー / パララックス |
| 数字 | カウントアップ |
| サイネージマップ | 拠点ピンの点滅（SVG） |
| ページ遷移 | フェード + マスクトランジション |

### 制約
- `prefers-reduced-motion` 時は全アニメーションを停止し静止表示。
- 重い WebGL 系はヒーロー1か所のみ。モバイルでは軽量版に切替。
- 目標: Lighthouse Performance 90以上、LCP 2.5秒以内。

## 5. コンテンツ・問い合わせ・品質

- `content/`: `businesses/*.json`、`stores/*.mdx`（住所・営業時間・SNS・ギャラリー・店舗サイトURL）、`news/*.mdx`、`recruit/*.mdx`。zod でスキーマ検証し、不備があればビルドを失敗させる。
- お問い合わせ: Server Action + Resend でメール送信、Cloudflare Turnstile でスパム対策。APIキー未設定の間は送信を無効化し、その旨を画面に表示する。
- SEO: ページ別メタ情報、OG画像（生成ビジュアルから作成）、構造化データ（Organization / LocalBusiness）、sitemap。
- 品質: PRごとに typecheck / lint / build、Playwright で主要ページの表示確認とスクリーンショット比較、Lighthouse 計測。

## 6. 素材の現状と不足

| 対象 | 状況 |
|---|---|
| KINGYO | 世界観の強い写真あり。多くが約600pxと低解像度のため表示サイズを抑える |
| B-club | 光の線のアート空間、高解像度（5184px） |
| C-girl | 外観1点（BAR C-GIRL） |
| 焼肉En | 料理写真 約40点 |
| 暖家 | 店内写真・ロゴ |
| 遊栄ビジョン | ピースビル・千松島ビルの設置写真 |
| **不足** | エーラクビル・晩翠通りの写真、Web開発・コンテンツ制作の素材、企業イメージ（人物・街並み・代表挨拶等） → Codex で生成し、実写入手後に差し替え |

## 7. フェーズ

1. 土台: プロジェクト作成、デザイントークン、AGENTS.md、画像パイプライン
2. ムードボード（Codex生成 → ユーザー選択）、ロゴ SVG 化
3. トップページ
4. 会社概要・事業・店舗ページ（テンプレート化）
5. お知らせ・採用・お問い合わせ
6. 仕上げ: SEO、パフォーマンス、Vercel 公開
