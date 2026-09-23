# 計画2: ムードボードとロゴSVG化 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax.

**Goal:** トップページのビジュアル方向性をユーザーが選べるムードボードを用意し、ロゴを SVG 化してヘッダーとファビコンに適用する。ヒーローアニメーション（計画3）で使えるよう、ロゴマークのピースを個別要素として扱える SVG を用意する。

**Architecture:** ロゴ原本 `.ai` は PDF 互換なので PyMuPDF で SVG に変換し、内容の外接矩形で viewBox をトリミングして `public/brand/` に置く。変換は再現可能な Python スクリプトとしてコミットする。ムードボードは既存の Codex パイプライン（`pnpm assets:gen`）で3方向×2案を生成し、比較ページで選んでもらう。採用案は `pnpm assets:adopt` で取り込み、設計書に決定を記録する。

**Tech Stack:** Python 3 + PyMuPDF（ロゴ変換のみ）/ 既存の assets-pipeline / Next.js

**Spec:** `docs/superpowers/specs/2026-09-23-yuei-corporate-site-design.md`（4. ロゴ、3-1. 画像生成フロー 5）

---

### Task 1: ロゴ SVG 変換スクリプト

**Files:**
- Create: `assets-pipeline/scripts/logo/export_logo.py`, `assets-pipeline/scripts/logo/requirements.txt`
- Create: `public/brand/yuei-logo.svg`（紺版・横組み）, `public/brand/yuei-logo-white.svg`（白版）, `public/brand/yuei-mark.svg`（マークのみ）

- [ ] **Step 1:** `requirements.txt` に `pymupdf` を記載。
- [ ] **Step 2:** `export_logo.py` を実装。入力と出力の対応:
  - `images/kingyo-bclublogo/YUEI_logo.ai` → `public/brand/yuei-logo.svg`
  - `images/kingyo-bclublogo/YUEI_logo-w.ai` → `public/brand/yuei-logo-white.svg`
  - `images/kingyo-bclublogo/YUEI_logo-nomi.ai` → `public/brand/yuei-mark.svg`
  処理: `fitz.open(src)[0]` → 描画要素の外接矩形（`page.get_drawings()` の rect の union、テキストがあれば `get_text("dict")` の bbox も含める）を求め、`page.set_cropbox(bbox)` 後に `get_svg_image(text_as_path=True)` で書き出す。幅・高さ属性を削除し `viewBox` のみ残す（CSS でサイズ指定するため）。
- [ ] **Step 3:** 実行 `python assets-pipeline/scripts/logo/export_logo.py`。3ファイルを PNG にラスタライズして目視確認（余白がトリミングされ、色・形が原本通りであること）。
- [ ] **Step 4:** `yuei-mark.svg` の構造を調べ、ピース（四角）と柱がそれぞれ独立した `<path>`（またはグループ）として分かれているかを記録する（計画3のアニメーション用）。分かれていない場合はその旨を報告。
- [ ] **Step 5:** Commit `feat: export brand logos as SVG`

### Task 2: ヘッダー・フッター・ファビコンへの適用

**Files:**
- Modify: `components/layout/site-header.tsx`, `components/layout/site-footer.tsx`
- Create: `app/icon.svg`（マークから生成）, Delete: `app/favicon.ico`, `public/brand/yuei-logo.png`

- [ ] **Step 1:** ヘッダーのロゴを `/brand/yuei-logo.svg` に置換（`next/image` で `unoptimized` 不要、SVG は `<Image src=... width height>` で可。viewBox の比率から width/height を設定）。
- [ ] **Step 2:** フッターの "YUEI JAPAN Inc." テキストの上にロゴ SVG を表示。
- [ ] **Step 3:** `app/icon.svg` をマーク SVG から作成（正方形 viewBox に余白を付けて中央配置）。`app/favicon.ico` を削除。
- [ ] **Step 4:** `pnpm typecheck && pnpm lint && pnpm test && pnpm build && pnpm e2e` 全通過、ヘッダーのスクリーンショット（モバイル/デスクトップ）で確認。
- [ ] **Step 5:** Commit `feat: use SVG logo in header, footer and favicon`

### Task 3: ムードボード生成と比較

**Files:**
- Create: `assets-pipeline/briefs/mood-a-glass.json`, `mood-b-city.json`, `mood-c-arch.json`

方向性（すべてホワイト基調、16:9、左側に見出し用の余白）:
- **A ガラスキューブ**: ロゴの柱と舞うピースを、白い光の中のガラスキューブで表現
- **B 国分町ハイキー**: 白く霞んだ夕暮れの国分町、青と暖色の小さな光のボケ
- **C 建築と光の柱**: ギャラリーのような白い建築空間に青く光る柱と浮かぶ光のパネル

- [ ] **Step 1:** 3ブリーフ作成、`ASSETS_GEN_CONCURRENCY=3 pnpm assets:gen mood-a-glass mood-b-city mood-c-arch`。
- [ ] **Step 2:** 6枚を目視確認。明らかな破綻（文字の混入、歪み）があればプロンプトを直して再生成。
- [ ] **Step 3:** 比較用 HTML（見出し「街の夜に、新しい価値を。」を実際のフォントで重ねたヒーロー見本、PC幅とスマホ幅の両方）を作り、ユーザーに選んでもらう。
- [ ] **Step 4:** 採用案を `pnpm assets:adopt <id> <vN>` で取り込み、設計書「4. デザインシステム」にヒーロービジュアルの決定を追記。
- [ ] **Step 5:** Commit `feat: add moodboard briefs and adopt hero visual`

### Task 4: PR・プレビュー確認

- [ ] `git push -u origin feat/plan2-moodboard-logo` → PR 作成 → CI 通過 → Vercel プレビュー確認 → ユーザー承認後マージ。
