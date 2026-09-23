<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# AGENTS.md — 遊栄JAPAN コーポレートサイト 共通規約

Claude と Codex の両方がこのファイルに従う。設計書: docs/superpowers/specs/2026-09-23-yuei-corporate-site-design.md

## 役割
- Claude: 指揮・実装・レビュー・デプロイ。
- Codex: 画像生成が基本。コード変更は依頼書 `assets-pipeline/tasks/<id>.md` がある場合のみ、`codex/<task>` ブランチで、依頼書に書かれたファイルだけを変更する。

## 絶対ルール
- main へ直接コミットしない（ブランチ → PR → CI → Vercel プレビュー確認 → マージ）。
- `images/`（原本写真）は読み取り専用。Git に入れない。
- 色・フォント・角丸は `app/globals.css` のトークン（`bg-surface`, `text-ink`, `text-brand-*` など）だけを使う。16進カラーを直書きしない。
- アニメーションのイージング・時間は `lib/motion.ts` の値だけを使う。
- すべてのアニメーションは `prefers-reduced-motion` で停止すること（`useReducedMotion()` を使う）。
- ホバー依存の演出には、モバイル（タッチ）用の代替演出を必ず用意する。
- コンテンツは `lib/content.ts` 経由でのみ読む。ページから `content/` を直接 import しない。
- 事実情報（住所・営業時間・電話番号など）を推測で書かない。不明なら空欄のままにする。

## 配置
- `components/ui/` shadcn 基本部品
- `components/effects/` 21st.dev 由来または自作エフェクト。1ファイル1エフェクト。21st.dev 由来なら冒頭に `// Source: <URL>` を書く
- `components/sections/` ページのセクション
- `components/layout/` ヘッダー・フッター

## 検証コマンド（PR 前に全て通す）
pnpm typecheck && pnpm lint && pnpm test && pnpm build && pnpm e2e
