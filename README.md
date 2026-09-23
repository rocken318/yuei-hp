# 遊栄JAPAN コーポレートサイト

遊栄JAPAN のコーポレートサイト。Next.js (App Router) + Tailwind CSS v4 + shadcn/ui + Motion で構築。

Corporate website for 遊栄JAPAN (Yuei Japan), built with Next.js (App Router), Tailwind CSS v4, shadcn/ui, and Motion.

## スタック / Stack

- Next.js 16 (App Router, Turbopack)
- React 19 / TypeScript
- Tailwind CSS v4 + shadcn/ui
- Motion (animation) + Lenis (smooth scroll)
- Vitest (unit) / Playwright (e2e)

## セットアップ / Setup

```bash
pnpm install
pnpm dev
```

## 検証コマンド / Checks

PR を出す前に、以下をすべて通してください / run all of these before opening a PR:

```bash
pnpm typecheck && pnpm lint && pnpm test && pnpm build && pnpm e2e
```

## アセット生成 / Asset pipeline

`assets-pipeline/` 配下のスクリプトで、原本写真から Web 用アセットを生成する。

```bash
pnpm assets:source                       # 原本画像 (images/) を最適化して取り込む
ASSETS_GEN_CONCURRENCY=2 pnpm assets:gen <briefId...>   # 依頼書からアセットを生成（並列数は環境変数で指定、既定 2）
pnpm assets:adopt <briefId> <vN>         # 生成済みバージョンを採用して public/ へ反映
```

## ドキュメント / Docs

- [`AGENTS.md`](./AGENTS.md) — Claude / Codex 共通の開発規約
- [`docs/superpowers/specs`](./docs/superpowers/specs) — 設計書
- [`docs/superpowers/plans`](./docs/superpowers/plans) — 実装計画
