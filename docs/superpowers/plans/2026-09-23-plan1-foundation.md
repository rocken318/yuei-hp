# 計画1: 土台づくり（Foundation） Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Next.js プロジェクト・デザイントークン・コンテンツ層・モーション基盤・共通レイアウト（モバイルメニュー付き）・Codex 画像パイプライン・CI を整え、Vercel プレビューで「動くトップの仮ページ」が表示される状態にする。

**Architecture:** Next.js App Router の SSG サイト。コンテンツは `content/` のファイルを `lib/content.ts`（zod 検証）経由でのみ読む。画像生成は `assets-pipeline/` の Node スクリプトが `codex exec` を呼び出し、採用版だけを `public/images/generated/` に最適化して置く。

**CLI スクリプトについて:** トップレベル await を使うため、CLI エントリは `.mts`（ESM）にする。共有ロジック `scripts/lib/*.ts` は通常の `.ts`。

**Tech Stack:** Next.js 16 / React 19 / TypeScript / Tailwind CSS v4 / shadcn/ui / motion / lenis / zod / gray-matter / sharp / vitest / Playwright / pnpm 10 / Node 22

**Spec:** `docs/superpowers/specs/2026-09-23-yuei-corporate-site-design.md`

**後続計画（本計画の範囲外）:** 計画2 ムードボード・ロゴSVG / 計画3 トップページ / 計画4 会社概要・事業・店舗 / 計画5 お知らせ・採用・問い合わせ / 計画6 SEO・性能・本番公開

---

## ファイル構成（本計画で作成）

| パス | 責務 |
|---|---|
| `AGENTS.md` / `CLAUDE.md` | Claude・Codex 共通規約 |
| `app/layout.tsx` | フォント・SmoothScroll・Header/Footer |
| `app/globals.css` | デザイントークン（色・フォント・角丸） |
| `app/page.tsx` | 仮トップ（計画3で置換） |
| `lib/motion.ts` | イージング・時間の3種トークン |
| `lib/content/schema.ts` | zod スキーマ（Business / Venue / Company） |
| `lib/content/repo.ts` | ディレクトリを受け取りコンテンツを読む純粋ロジック |
| `lib/content.ts` | アプリ用の唯一の入口（`content/` を固定で読む） |
| `content/**` | 事業・拠点・会社データ |
| `components/providers/smooth-scroll.tsx` | Lenis（タッチ同期・reduced-motion 対応） |
| `components/effects/reveal.tsx` | スクロール連動リビールの基本部品 |
| `components/layout/site-header.tsx` | 固定ヘッダー＋モバイル全画面メニュー |
| `components/layout/site-footer.tsx` | フッター |
| `components/layout/nav-items.ts` | ナビ定義 |
| `assets-pipeline/source-map.json` | 実写原本 → 公開パスの対応表 |
| `assets-pipeline/scripts/optimize-source.mts` | 実写原本の縮小・変換 |
| `assets-pipeline/scripts/lib/brief.ts` | ブリーフ読込・プロンプト合成・codex 引数生成 |
| `assets-pipeline/scripts/gen.mts` | `codex exec` 起動 |
| `assets-pipeline/scripts/adopt.mts` | 採用版の最適化と manifest 記録 |
| `assets-pipeline/briefs/_style.json` | 共通スタイル |
| `tests/**` | vitest 単体テスト |
| `e2e/smoke.spec.ts` | Playwright（モバイル/デスクトップ） |
| `.github/workflows/ci.yml` | CI |

---

### Task 1: Next.js プロジェクトの生成

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `app/*`, `eslint.config.mjs`, `postcss.config.mjs` ほか create-next-app の生成物
- Modify: `.gitignore`

- [ ] **Step 1: 一時ディレクトリに生成してルートへ移す**（ルートに既存ファイルがあるため）

```bash
cd /y/k-yueiHP
pnpm dlx create-next-app@16.3.6 .scaffold --ts --tailwind --eslint --app --no-src-dir --import-alias "@/*" --use-pnpm --turbopack --yes --skip-install --disable-git
cp .scaffold/.gitignore .gitignore.next
rm .scaffold/.gitignore
cp -r .scaffold/. .
rm -rf .scaffold
```

- [ ] **Step 2: .gitignore を統合**

`.gitignore.next` の内容を `.gitignore` に追記し、既存の行（`images/`, `assets-pipeline/generated/`）を残す。重複行は削除。

```bash
cat .gitignore.next >> .gitignore && rm .gitignore.next
```
追記後、エディタで重複行を削除する。

最終的に最低限以下を含むこと:
```
images/
assets-pipeline/generated/
node_modules/
.next/
out/
.env*
.vercel/
test-results/
playwright-report/
next-env.d.ts
```

- [ ] **Step 3: 依存を追加**

```bash
pnpm install
pnpm add motion lenis zod gray-matter clsx tailwind-merge
pnpm add -D vitest @vitejs/plugin-react vite-tsconfig-paths sharp tsx @playwright/test @types/node
pnpm exec playwright install chromium webkit
```

- [ ] **Step 4: scripts を package.json に追加**

```json
{
  "scripts": {
    "dev": "next dev --turbopack",
    "build": "next build",
    "start": "next start",
    "lint": "eslint .",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "e2e": "playwright test",
    "assets:source": "tsx assets-pipeline/scripts/optimize-source.mts",
    "assets:gen": "tsx assets-pipeline/scripts/gen.mts",
    "assets:adopt": "tsx assets-pipeline/scripts/adopt.mts"
  }
}
```
（既存の `dev`/`build`/`start`/`lint` は上書き）

- [ ] **Step 5: vitest 設定**

Create `vitest.config.ts`:
```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    include: ["tests/**/*.test.ts", "tests/**/*.test.tsx"],
    environment: "node",
  },
});
```

- [ ] **Step 6: 動作確認**

Run: `pnpm typecheck && pnpm lint && pnpm build`
Expected: いずれもエラーなしで完了

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "chore: scaffold Next.js 16 app with tooling"
```

---

### Task 2: shadcn/ui 初期化と共通規約（AGENTS.md）

**Files:**
- Create: `components.json`, `lib/utils.ts`（shadcn 生成）, `AGENTS.md`, `CLAUDE.md`

- [ ] **Step 1: shadcn 初期化**

```bash
pnpm dlx shadcn@latest init --yes --base-color neutral
```
Expected: `components.json` と `lib/utils.ts`（`cn()`）が生成される。`app/globals.css` が書き換わるが Task 3 で上書きする。

- [ ] **Step 2: AGENTS.md を作成**

```markdown
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
```

- [ ] **Step 3: CLAUDE.md を作成**

```markdown
@AGENTS.md
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: init shadcn/ui and add shared agent conventions"
```

---

### Task 3: デザイントークンとフォント

**Files:**
- Modify: `app/globals.css`（全置換）, `app/layout.tsx`

- [ ] **Step 1: globals.css を置換**

```css
@import "tailwindcss";

@theme {
  --color-surface: #ffffff;
  --color-surface-muted: #f6f8fb;
  --color-line: #e3e8ef;
  --color-ink: #231815;
  --color-ink-muted: #5b6573;
  --color-brand-navy: #000f50;
  --color-brand-blue: #0d3192;
  --color-brand-sky: #b8ddf3;

  --font-sans: var(--font-noto-sans-jp), system-ui, sans-serif;
  --font-heading: var(--font-zen-kaku), var(--font-noto-sans-jp), sans-serif;
  --font-display: var(--font-space-grotesk), var(--font-zen-kaku), sans-serif;

  --radius-card: 1.25rem;
}

@layer base {
  html {
    color: var(--color-ink);
    background: var(--color-surface);
    -webkit-font-smoothing: antialiased;
  }
  body {
    font-family: var(--font-sans);
    font-feature-settings: "palt";
  }
  h1, h2, h3 {
    font-family: var(--font-heading);
    letter-spacing: 0.02em;
  }
}

.bg-brand-gradient {
  background-image: linear-gradient(135deg, var(--color-brand-navy), var(--color-brand-blue) 55%, var(--color-brand-sky));
}

/* Lenis 推奨スタイル */
html.lenis, html.lenis body { height: auto; }
.lenis.lenis-smooth { scroll-behavior: auto !important; }
.lenis.lenis-stopped { overflow: hidden; }
```

- [ ] **Step 2: layout.tsx でフォントを読み込む**（Header/Footer/SmoothScroll は Task 6・7 で追加）

```tsx
import type { Metadata } from "next";
import { Noto_Sans_JP, Zen_Kaku_Gothic_New, Space_Grotesk } from "next/font/google";
import "./globals.css";

const notoSans = Noto_Sans_JP({ subsets: ["latin"], weight: ["400", "500", "700"], variable: "--font-noto-sans-jp", display: "swap" });
const zenKaku = Zen_Kaku_Gothic_New({ subsets: ["latin"], weight: ["500", "700", "900"], variable: "--font-zen-kaku", display: "swap" });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], weight: ["400", "500", "700"], variable: "--font-space-grotesk", display: "swap" });

export const metadata: Metadata = {
  title: { default: "遊栄JAPAN株式会社", template: "%s | 遊栄JAPAN" },
  description: "仙台・国分町を拠点に、ナイトエンターテインメント・飲食・デジタルサイネージ・Web開発を展開する遊栄JAPAN株式会社のコーポレートサイト。",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" className={`${notoSans.variable} ${zenKaku.variable} ${spaceGrotesk.variable}`}>
      <body className="bg-surface text-ink">{children}</body>
    </html>
  );
}
```

- [ ] **Step 3: 確認**

Run: `pnpm typecheck && pnpm build`
Expected: 成功

- [ ] **Step 4: Commit**

```bash
git add app/globals.css app/layout.tsx
git commit -m "feat: add design tokens and font setup"
```

---

### Task 4: コンテンツスキーマとリポジトリ（TDD）

**Files:**
- Create: `lib/content/schema.ts`, `lib/content/repo.ts`, `tests/content/repo.test.ts`, `tests/fixtures/content/**`

- [ ] **Step 1: テスト用フィクスチャを作成**

`tests/fixtures/content/businesses/dining.json`:
```json
{ "slug": "dining", "name": "飲食事業", "nameEn": "Dining", "summary": "テスト用の要約", "order": 2 }
```
`tests/fixtures/content/businesses/signage.json`:
```json
{ "slug": "signage", "name": "デジタルサイネージ事業", "nameEn": "Digital Signage", "brand": "遊栄ビジョン", "summary": "テスト用", "order": 3 }
```
`tests/fixtures/content/venues/dining/en.mdx`:
```mdx
---
slug: en
business: dining
kind: store
name: 焼肉En
category: 焼肉
catchcopy: テスト
order: 1
gallery: []
---
本文テキスト
```
`tests/fixtures/content/venues/dining/danke.mdx`:
```mdx
---
slug: danke
business: dining
kind: store
name: ダイニングバー暖家
category: ダイニングバー
catchcopy: テスト
order: 2
gallery: []
---
暖家の本文
```

- [ ] **Step 2: 失敗するテストを書く**

`tests/content/repo.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import path from "node:path";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { createContentRepo } from "@/lib/content/repo";

const fixtures = path.join(__dirname, "../fixtures/content");

describe("createContentRepo", () => {
  const repo = createContentRepo(fixtures);

  it("事業を order 順に返す", () => {
    expect(repo.getBusinesses().map((b) => b.slug)).toEqual(["dining", "signage"]);
  });

  it("slug で事業を1件取得し、無ければ undefined", () => {
    expect(repo.getBusiness("signage")?.brand).toBe("遊栄ビジョン");
    expect(repo.getBusiness("digital")).toBeUndefined();
  });

  it("事業ごとの拠点を order 順に返し、本文を含む", () => {
    const venues = repo.getVenues("dining");
    expect(venues.map((v) => v.slug)).toEqual(["en", "danke"]);
    expect(venues[1].body.trim()).toBe("暖家の本文");
  });

  it("拠点を1件取得できる", () => {
    expect(repo.getVenue("dining", "en")?.name).toBe("焼肉En");
    expect(repo.getVenue("dining", "nope")).toBeUndefined();
  });

  it("スキーマ違反のファイルはファイル名付きで例外になる", () => {
    const dir = mkdtempSync(path.join(tmpdir(), "content-"));
    mkdirSync(path.join(dir, "businesses"));
    writeFileSync(path.join(dir, "businesses", "bad.json"), JSON.stringify({ slug: "bad" }));
    expect(() => createContentRepo(dir).getBusinesses()).toThrow(/bad\.json/);
  });
});
```

- [ ] **Step 3: 失敗を確認**

Run: `pnpm test tests/content/repo.test.ts`
Expected: FAIL（`Cannot find module '@/lib/content/repo'`）

- [ ] **Step 4: スキーマを実装**

`lib/content/schema.ts`:
```ts
import { z } from "zod";

export const businessSlugs = ["nightlife", "dining", "signage", "digital"] as const;
export type BusinessSlug = (typeof businessSlugs)[number];

export const BusinessSchema = z.object({
  slug: z.enum(businessSlugs),
  name: z.string().min(1),
  nameEn: z.string().min(1),
  brand: z.string().optional(),
  summary: z.string().min(1),
  heroImage: z.string().optional(),
  order: z.number().int(),
});
export type Business = z.infer<typeof BusinessSchema>;

export const VenueFrontmatterSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  business: z.enum(["nightlife", "dining", "signage"]),
  kind: z.enum(["store", "signage"]),
  name: z.string().min(1),
  nameEn: z.string().optional(),
  category: z.string().min(1),
  catchcopy: z.string().min(1),
  address: z.string().optional(),
  hours: z.string().optional(),
  closed: z.string().optional(),
  tel: z.string().optional(),
  mapUrl: z.string().url().optional(),
  siteUrl: z.string().url().optional(),
  sns: z
    .object({
      instagram: z.string().url().optional(),
      x: z.string().url().optional(),
      tiktok: z.string().url().optional(),
      line: z.string().url().optional(),
    })
    .default({}),
  heroImage: z.string().optional(),
  gallery: z.array(z.string()).default([]),
  order: z.number().int(),
});
export type Venue = z.infer<typeof VenueFrontmatterSchema> & { body: string };
```

- [ ] **Step 5: リポジトリを実装**

`lib/content/repo.ts`:
```ts
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import type { z } from "zod";
import { BusinessSchema, VenueFrontmatterSchema, type Business, type BusinessSlug, type Venue } from "./schema";

function parseOrThrow<T>(schema: z.ZodType<T>, data: unknown, file: string): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new Error(`Invalid content in ${file}: ${result.error.message}`);
  }
  return result.data;
}

function listFiles(dir: string, ext: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((f) => f.endsWith(ext)).map((f) => path.join(dir, f));
}

const byOrder = <T extends { order: number }>(a: T, b: T) => a.order - b.order;

export function createContentRepo(root: string) {
  function getBusinesses(): Business[] {
    return listFiles(path.join(root, "businesses"), ".json")
      .map((file) => parseOrThrow(BusinessSchema, JSON.parse(fs.readFileSync(file, "utf8")), path.basename(file)))
      .sort(byOrder);
  }

  function getBusiness(slug: string): Business | undefined {
    return getBusinesses().find((b) => b.slug === slug);
  }

  function getVenues(business: Exclude<BusinessSlug, "digital">): Venue[] {
    return listFiles(path.join(root, "venues", business), ".mdx")
      .map((file) => {
        const { data, content } = matter(fs.readFileSync(file, "utf8"));
        const fm = parseOrThrow(VenueFrontmatterSchema, data, path.basename(file));
        return { ...fm, body: content };
      })
      .sort(byOrder);
  }

  function getVenue(business: Exclude<BusinessSlug, "digital">, slug: string): Venue | undefined {
    return getVenues(business).find((v) => v.slug === slug);
  }

  return { getBusinesses, getBusiness, getVenues, getVenue };
}
```

- [ ] **Step 6: テスト通過を確認**

Run: `pnpm test tests/content/repo.test.ts`
Expected: 5 passed

- [ ] **Step 7: Commit**

```bash
git add lib/content tests
git commit -m "feat: add zod-validated content repository"
```

---

### Task 5: 実コンテンツとアプリ用の入口

**Files:**
- Create: `lib/content.ts`, `content/businesses/*.json`（4件）, `content/venues/**.mdx`（9件）, `tests/content/real-content.test.ts`

- [ ] **Step 1: 実コンテンツを検証するテストを書く**

`tests/content/real-content.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { content } from "@/lib/content";

describe("content/ の実データ", () => {
  it("4事業すべてが存在する", () => {
    expect(content.getBusinesses().map((b) => b.slug)).toEqual(["nightlife", "dining", "signage", "digital"]);
  });
  it("拠点数が設計どおり", () => {
    expect(content.getVenues("nightlife").map((v) => v.slug)).toEqual(["kingyo", "b-club", "c-girl"]);
    expect(content.getVenues("dining").map((v) => v.slug)).toEqual(["en", "danke"]);
    expect(content.getVenues("signage").map((v) => v.slug)).toEqual(["chimatsushima", "peace", "eiraku", "bansui"]);
  });
});
```

- [ ] **Step 2: 失敗を確認**

Run: `pnpm test tests/content/real-content.test.ts`
Expected: FAIL（`@/lib/content` が無い）

- [ ] **Step 3: 入口を作る**

`lib/content.ts`:
```ts
import path from "node:path";
import { createContentRepo } from "./content/repo";

export const content = createContentRepo(path.join(process.cwd(), "content"));
export type { Business, Venue, BusinessSlug } from "./content/schema";
```

- [ ] **Step 4: 事業データを作る**

`content/businesses/nightlife.json`:
```json
{ "slug": "nightlife", "name": "ナイトエンターテインメント事業", "nameEn": "Night Entertainment", "summary": "国分町の夜を彩るラウンジ・クラブ・バーを運営。非日常の空間と上質なおもてなしを提供します。", "order": 1 }
```
`content/businesses/dining.json`:
```json
{ "slug": "dining", "name": "飲食事業", "nameEn": "Dining", "summary": "焼肉とダイニングバー。食を通じて、仲間と過ごす時間の価値を高めます。", "order": 2 }
```
`content/businesses/signage.json`:
```json
{ "slug": "signage", "name": "デジタルサイネージ事業", "nameEn": "Digital Signage", "brand": "遊栄ビジョン", "summary": "国分町の主要動線に設置した大型ビジョンで、街ゆく人々へ確実に届く広告枠を提供します。", "order": 3 }
```
`content/businesses/digital.json`:
```json
{ "slug": "digital", "name": "Web開発・コンテンツ制作事業", "nameEn": "Web & Content Production", "summary": "Webサイト・システム開発から映像・サイネージ向けコンテンツ制作まで、自社運営で培った知見でワンストップに支援します。", "order": 4 }
```

- [ ] **Step 5: 拠点データを作る**（住所・営業時間などは不明のため空欄。推測で書かない）

`content/venues/nightlife/kingyo.mdx`:
```mdx
---
slug: kingyo
business: nightlife
kind: store
name: KINGYO
category: キャバクラ
catchcopy: 金魚が舞う、非日常のラグジュアリー空間
order: 1
gallery: []
---
```
`content/venues/nightlife/b-club.mdx`:
```mdx
---
slug: b-club
business: nightlife
kind: store
name: B-club
category: キャバクラ
catchcopy: 光のアートに包まれる夜
order: 2
gallery: []
---
```
`content/venues/nightlife/c-girl.mdx`:
```mdx
---
slug: c-girl
business: nightlife
kind: store
name: C-girl
category: ガールズバー
catchcopy: レトロフューチャーなネオンのガールズバー
order: 3
gallery: []
---
```
`content/venues/dining/en.mdx`:
```mdx
---
slug: en
business: dining
kind: store
name: 焼肉En
category: 焼肉
catchcopy: 仲間と囲む、上質な焼肉
order: 1
gallery: []
---
```
`content/venues/dining/danke.mdx`:
```mdx
---
slug: danke
business: dining
kind: store
name: ダイニングバー暖家
category: ダイニングバー
catchcopy: 温もりのある空間で、ゆったりと
order: 2
gallery: []
---
```
`content/venues/signage/chimatsushima.mdx`:
```mdx
---
slug: chimatsushima
business: signage
kind: signage
name: 千松島ビル
category: 遊栄ビジョン
catchcopy: 国分町の人の流れを捉えるビジョン
order: 1
gallery: []
---
```
`content/venues/signage/peace.mdx`:
```mdx
---
slug: peace
business: signage
kind: signage
name: ピースビル
category: 遊栄ビジョン
catchcopy: 国分町のメインストリートに面したビジョン
order: 2
gallery: []
---
```
`content/venues/signage/eiraku.mdx`:
```mdx
---
slug: eiraku
business: signage
kind: signage
name: エーラクビル
category: 遊栄ビジョン
catchcopy: 国分町エリアのビジョン
order: 3
gallery: []
---
```
`content/venues/signage/bansui.mdx`:
```mdx
---
slug: bansui
business: signage
kind: signage
name: 晩翠通り
category: 遊栄ビジョン
catchcopy: 晩翠通り沿いのビジョン
order: 4
gallery: []
---
```

- [ ] **Step 6: テスト通過を確認**

Run: `pnpm test`
Expected: 全テスト PASS（7 passed）

- [ ] **Step 7: Commit**

```bash
git add lib/content.ts content tests/content/real-content.test.ts
git commit -m "feat: add business and venue content"
```

---

### Task 6: モーション基盤（トークン・SmoothScroll・Reveal）

**Files:**
- Create: `lib/motion.ts`, `components/providers/smooth-scroll.tsx`, `components/effects/reveal.tsx`, `tests/motion.test.ts`
- Modify: `app/layout.tsx`

- [ ] **Step 1: トークンのテストを書く**

`tests/motion.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { ease, duration, revealVariants } from "@/lib/motion";

describe("motion tokens", () => {
  it("イージングと時間はそれぞれ3種類に限定", () => {
    expect(Object.keys(ease)).toEqual(["out", "inOut", "expo"]);
    expect(Object.keys(duration)).toEqual(["fast", "base", "slow"]);
  });
  it("reveal は下から浮かび上がり、reduced のときは移動しない", () => {
    expect(revealVariants(false).hidden).toMatchObject({ opacity: 0, y: 32 });
    expect(revealVariants(true).hidden).toMatchObject({ opacity: 0, y: 0 });
  });
});
```

- [ ] **Step 2: 失敗を確認**

Run: `pnpm test tests/motion.test.ts`
Expected: FAIL（モジュールなし）

- [ ] **Step 3: lib/motion.ts を実装**

```ts
import type { Variants } from "motion/react";

export const ease = {
  out: [0.22, 1, 0.36, 1],
  inOut: [0.65, 0, 0.35, 1],
  expo: [0.16, 1, 0.3, 1],
} as const;

export const duration = {
  fast: 0.25,
  base: 0.6,
  slow: 1.2,
} as const;

export function revealVariants(reduced: boolean): Variants {
  return {
    hidden: { opacity: 0, y: reduced ? 0 : 32 },
    visible: { opacity: 1, y: 0, transition: { duration: reduced ? duration.fast : duration.base, ease: ease.out } },
  };
}
```

- [ ] **Step 4: テスト通過を確認**

Run: `pnpm test tests/motion.test.ts`
Expected: 2 passed

- [ ] **Step 5: SmoothScroll を実装**（タッチ同期でスマホのスワイプにも慣性を効かせる）

`components/providers/smooth-scroll.tsx`:
```tsx
"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import { useReducedMotion } from "motion/react";

export function SmoothScroll({ children }: { children: React.ReactNode }) {
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) return;
    const lenis = new Lenis({ lerp: 0.1, syncTouch: true, syncTouchLerp: 0.075 });
    let frame = requestAnimationFrame(function raf(time) {
      lenis.raf(time);
      frame = requestAnimationFrame(raf);
    });
    return () => {
      cancelAnimationFrame(frame);
      lenis.destroy();
    };
  }, [reduced]);

  return <>{children}</>;
}
```

- [ ] **Step 6: Reveal を実装**

`components/effects/reveal.tsx`:
```tsx
"use client";

import { motion, useReducedMotion } from "motion/react";
import { revealVariants } from "@/lib/motion";

type Props = {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  as?: "div" | "section" | "li";
};

export function Reveal({ children, className, delay = 0, as = "div" }: Props) {
  const reduced = useReducedMotion() ?? false;
  const Component = motion[as];
  return (
    <Component
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.3 }}
      variants={revealVariants(reduced)}
      transition={{ delay }}
    >
      {children}
    </Component>
  );
}
```

- [ ] **Step 7: layout.tsx の body を SmoothScroll で包む**

```tsx
import { SmoothScroll } from "@/components/providers/smooth-scroll";
// ...
<body className="bg-surface text-ink">
  <SmoothScroll>{children}</SmoothScroll>
</body>
```

- [ ] **Step 8: 確認と Commit**

Run: `pnpm typecheck && pnpm test`
Expected: 成功

```bash
git add lib/motion.ts components tests/motion.test.ts app/layout.tsx
git commit -m "feat: add motion tokens, smooth scroll and reveal primitive"
```

---

### Task 7: ヘッダー（モバイル全画面メニュー）・フッター

**Files:**
- Create: `components/layout/nav-items.ts`, `components/layout/site-header.tsx`, `components/layout/site-footer.tsx`, `public/brand/yuei-logo.png`
- Modify: `app/layout.tsx`

- [ ] **Step 1: ロゴを配置**（SVG 化は計画2。ここでは PNG を使う）

```bash
mkdir -p public/brand
cp images/kingyo-bclublogo/YUEI_logo.png public/brand/yuei-logo.png
```
画像サイズを確認し、以降の `width`/`height` に使う:
```bash
node -e "require('sharp')('public/brand/yuei-logo.png').metadata().then(m=>console.log(m.width,m.height))"
```

- [ ] **Step 2: ナビ定義**

`components/layout/nav-items.ts`:
```ts
export const navItems = [
  { href: "/about", label: "会社概要", en: "About" },
  { href: "/business", label: "事業紹介", en: "Business" },
  { href: "/news", label: "お知らせ", en: "News" },
  { href: "/recruit", label: "採用情報", en: "Recruit" },
] as const;

export const contactItem = { href: "/contact", label: "お問い合わせ", en: "Contact" } as const;
```

- [ ] **Step 3: ヘッダー**

`components/layout/site-header.tsx`（`LOGO_W`/`LOGO_H` は Step 1 で確認した値に置き換える）:
```tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { navItems, contactItem } from "./nav-items";
import { duration, ease } from "@/lib/motion";

const LOGO_W = 400;
const LOGO_H = 165;

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const reduced = useReducedMotion() ?? false;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.documentElement.style.overflow = open ? "hidden" : "";
  }, [open]);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors ${scrolled || open ? "bg-surface/80 backdrop-blur-md border-b border-line" : "bg-transparent"}`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 md:h-20 md:px-8">
        <Link href="/" aria-label="遊栄JAPAN トップへ" onClick={() => setOpen(false)}>
          <Image src="/brand/yuei-logo.png" alt="遊栄JAPAN" width={LOGO_W} height={LOGO_H} priority className="h-8 w-auto md:h-10" />
        </Link>

        <nav className="hidden items-center gap-8 md:flex" aria-label="メインナビゲーション">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="text-sm font-medium text-ink hover:text-brand-blue">
              {item.label}
            </Link>
          ))}
          <Link href={contactItem.href} className="rounded-full bg-brand-blue px-5 py-2 text-sm font-medium text-white hover:bg-brand-navy">
            {contactItem.label}
          </Link>
        </nav>

        <button
          type="button"
          className="relative h-10 w-10 md:hidden"
          aria-label={open ? "メニューを閉じる" : "メニューを開く"}
          aria-expanded={open}
          aria-controls="mobile-menu"
          onClick={() => setOpen((v) => !v)}
        >
          <span className={`absolute left-2 right-2 h-0.5 bg-ink transition-transform ${open ? "top-1/2 rotate-45" : "top-[14px]"}`} />
          <span className={`absolute left-2 right-2 h-0.5 bg-ink transition-transform ${open ? "top-1/2 -rotate-45" : "bottom-[14px]"}`} />
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.nav
            id="mobile-menu"
            aria-label="モバイルメニュー"
            className="fixed inset-0 top-16 bg-surface px-6 pt-10 md:hidden"
            initial={{ clipPath: reduced ? "inset(0 0 0 0)" : "inset(0 0 100% 0)" }}
            animate={{ clipPath: "inset(0 0 0 0)" }}
            exit={{ clipPath: reduced ? "inset(0 0 0 0)" : "inset(0 0 100% 0)", opacity: reduced ? 0 : 1 }}
            transition={{ duration: duration.base, ease: ease.expo }}
          >
            <ul className="space-y-6">
              {[...navItems, contactItem].map((item, i) => (
                <motion.li
                  key={item.href}
                  initial={{ opacity: 0, y: reduced ? 0 : 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: reduced ? 0 : 0.15 + i * 0.06, duration: duration.base, ease: ease.out }}
                >
                  <Link href={item.href} onClick={() => setOpen(false)} className="block">
                    <span className="block font-display text-3xl font-bold text-brand-navy">{item.en}</span>
                    <span className="text-sm text-ink-muted">{item.label}</span>
                  </Link>
                </motion.li>
              ))}
            </ul>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
```

- [ ] **Step 4: フッター**

`components/layout/site-footer.tsx`:
```tsx
import Link from "next/link";
import { navItems, contactItem } from "./nav-items";

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-surface-muted">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 md:grid-cols-2 md:px-8">
        <div>
          <p className="font-display text-xl font-bold text-brand-navy">YUEI JAPAN Inc.</p>
          <p className="mt-2 text-sm text-ink-muted">遊栄JAPAN株式会社</p>
        </div>
        <nav aria-label="フッターナビゲーション" className="grid grid-cols-2 gap-3 text-sm">
          {[...navItems, contactItem, { href: "/privacy", label: "プライバシーポリシー", en: "Privacy" }].map((item) => (
            <Link key={item.href} href={item.href} className="text-ink hover:text-brand-blue">
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
      <p className="border-t border-line py-6 text-center text-xs text-ink-muted">© YUEI JAPAN Inc. All rights reserved.</p>
    </footer>
  );
}
```

- [ ] **Step 5: layout.tsx に組み込む**

```tsx
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
// ...
<SmoothScroll>
  <SiteHeader />
  <main>{children}</main>
  <SiteFooter />
</SmoothScroll>
```

- [ ] **Step 6: 確認と Commit**

Run: `pnpm typecheck && pnpm lint && pnpm build`
Expected: 成功

```bash
git add components/layout app/layout.tsx public/brand
git commit -m "feat: add site header with mobile fullscreen menu and footer"
```

---

### Task 8: 仮トップページとモバイル E2E

**Files:**
- Modify: `app/page.tsx`（全置換）
- Create: `playwright.config.ts`, `e2e/smoke.spec.ts`

- [ ] **Step 1: 失敗する E2E を書く**

`playwright.config.ts`:
```ts
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "e2e",
  use: { baseURL: "http://localhost:3100" },
  webServer: { command: "pnpm build && pnpm start -p 3100", port: 3100, reuseExistingServer: !process.env.CI, timeout: 180_000 },
  projects: [
    { name: "mobile", use: { ...devices["iPhone 14"] } },
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
  ],
});
```

`e2e/smoke.spec.ts`:
```ts
import { test, expect } from "@playwright/test";

test("トップが表示され、コンソールエラーがない", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await page.mouse.wheel(0, 1500);
  await expect(page.getByTestId("business-preview")).toBeVisible();
  expect(errors).toEqual([]);
});

test("モバイルでメニューが開閉できる", async ({ page, isMobile }) => {
  test.skip(!isMobile, "mobile only");
  await page.goto("/");
  await page.getByRole("button", { name: "メニューを開く" }).click();
  await expect(page.getByRole("navigation", { name: "モバイルメニュー" })).toBeVisible();
  await page.getByRole("button", { name: "メニューを閉じる" }).click();
  await expect(page.getByRole("navigation", { name: "モバイルメニュー" })).toBeHidden();
});
```

- [ ] **Step 2: 失敗を確認**

Run: `pnpm e2e`
Expected: FAIL（`business-preview` が存在しない）

- [ ] **Step 3: 仮トップを実装**（計画3で本実装に置換される）

`app/page.tsx`:
```tsx
import { content } from "@/lib/content";
import { Reveal } from "@/components/effects/reveal";

export default function HomePage() {
  const businesses = content.getBusinesses();
  return (
    <>
      <section className="relative flex min-h-[100svh] items-center overflow-hidden px-5 md:px-8">
        <div aria-hidden className="bg-brand-gradient absolute -right-40 -top-40 h-[36rem] w-[36rem] rounded-full opacity-20 blur-3xl" />
        <div className="relative mx-auto w-full max-w-7xl">
          <Reveal>
            <p className="font-display text-sm tracking-[0.3em] text-brand-blue">YUEI JAPAN Inc.</p>
          </Reveal>
          <Reveal delay={0.1}>
            <h1 className="mt-4 text-4xl font-bold leading-tight md:text-7xl">
              街の夜に、
              <br />
              新しい価値を。
            </h1>
          </Reveal>
        </div>
      </section>

      <section data-testid="business-preview" className="mx-auto max-w-7xl px-5 py-24 md:px-8">
        <ul className="grid gap-6 md:grid-cols-2">
          {businesses.map((b, i) => (
            <Reveal as="li" key={b.slug} delay={i * 0.08} className="rounded-card border border-line bg-surface-muted p-8">
              <p className="font-display text-xs tracking-[0.2em] text-brand-blue">{b.nameEn}</p>
              <h2 className="mt-2 text-2xl font-bold">{b.brand ?? b.name}</h2>
              <p className="mt-3 text-sm leading-relaxed text-ink-muted">{b.summary}</p>
            </Reveal>
          ))}
        </ul>
      </section>
    </>
  );
}
```

- [ ] **Step 4: E2E 通過を確認**

Run: `pnpm e2e`
Expected: mobile / desktop とも PASS（3 passed, 1 skipped）

- [ ] **Step 5: Commit**

```bash
git add app/page.tsx playwright.config.ts e2e
git commit -m "feat: add placeholder home and mobile/desktop smoke tests"
```

---

### Task 9: 実写原本の最適化スクリプト（TDD）

**Files:**
- Create: `assets-pipeline/scripts/lib/optimize.ts`, `assets-pipeline/scripts/optimize-source.mts`, `assets-pipeline/source-map.json`, `tests/assets/optimize.test.ts`

- [ ] **Step 1: 失敗するテストを書く**

`tests/assets/optimize.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import sharp from "sharp";
import path from "node:path";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { optimizeImage } from "@/assets-pipeline/scripts/lib/optimize";

describe("optimizeImage", () => {
  it("長辺を maxEdge に縮小し webp で書き出す", async () => {
    const dir = mkdtempSync(path.join(tmpdir(), "opt-"));
    const src = path.join(dir, "big.png");
    await sharp({ create: { width: 4000, height: 2000, channels: 3, background: "#0d3192" } }).png().toFile(src);

    const out = await optimizeImage(src, path.join(dir, "out/big"), { maxEdge: 2560 });

    expect(out).toBe(path.join(dir, "out/big.webp"));
    const meta = await sharp(out).metadata();
    expect(meta.format).toBe("webp");
    expect(meta.width).toBe(2560);
    expect(meta.height).toBe(1280);
  });

  it("小さい画像は拡大しない", async () => {
    const dir = mkdtempSync(path.join(tmpdir(), "opt-"));
    const src = path.join(dir, "small.png");
    await sharp({ create: { width: 600, height: 600, channels: 3, background: "#ffffff" } }).png().toFile(src);
    const out = await optimizeImage(src, path.join(dir, "small"), { maxEdge: 2560 });
    expect((await sharp(out).metadata()).width).toBe(600);
  });
});
```

- [ ] **Step 2: 失敗を確認**

Run: `pnpm test tests/assets/optimize.test.ts`
Expected: FAIL（モジュールなし）

- [ ] **Step 3: 実装**

`assets-pipeline/scripts/lib/optimize.ts`:
```ts
import sharp from "sharp";
import path from "node:path";
import { mkdirSync } from "node:fs";

export async function optimizeImage(src: string, outBase: string, opts: { maxEdge: number; quality?: number }): Promise<string> {
  const out = `${outBase}.webp`;
  mkdirSync(path.dirname(out), { recursive: true });
  await sharp(src)
    .rotate()
    .resize({ width: opts.maxEdge, height: opts.maxEdge, fit: "inside", withoutEnlargement: true })
    .webp({ quality: opts.quality ?? 82 })
    .toFile(out);
  return out;
}
```

- [ ] **Step 4: テスト通過を確認**

Run: `pnpm test tests/assets/optimize.test.ts`
Expected: 2 passed

- [ ] **Step 5: 対応表と CLI を作る**

`assets-pipeline/source-map.json`（原本 `images/` 相対 → `public/images/source/` 相対、拡張子なし）:
```json
[
  { "src": "kingyo/a.jpg", "out": "kingyo/goldfish-bowl" },
  { "src": "kingyo/Kngyo店内_6300.jpg", "out": "kingyo/chandelier" },
  { "src": "kingyo/pra/parallax_goldfish.jpg", "out": "kingyo/parallax-goldfish" },
  { "src": "kingyo/pra/parallax_wagara.jpg", "out": "kingyo/parallax-wagara" },
  { "src": "kingyo/pra/parallax_champagne.jpg", "out": "kingyo/parallax-champagne" },
  { "src": "Bclub/21.12.04_B-Club_002.JPG", "out": "b-club/light-01" },
  { "src": "Bclub/21.12.04_B-Club_003.JPG", "out": "b-club/light-02" },
  { "src": "Bclub/21.12.04_B-Club_005.jpg", "out": "b-club/light-03" },
  { "src": "C-girl/b8bb04e0-6a53-4243-83ad-eaff3916e17f.png", "out": "c-girl/exterior" },
  { "src": "En/S__35217416_0.jpg", "out": "en/dish-01" },
  { "src": "En/S__35217418_0.jpg", "out": "en/dish-02" },
  { "src": "En/S__35217419_0.jpg", "out": "en/dish-03" },
  { "src": "暖家/IMG_1894.jpg", "out": "danke/interior-01" },
  { "src": "暖家/IMG_1895.jpg", "out": "danke/interior-02" },
  { "src": "暖家/ロゴ.png", "out": "danke/logo" },
  { "src": "ビジョン/国分町ピースビル.JPEG", "out": "signage/peace" },
  { "src": "ビジョン/国分町千松島ビル.JPEG", "out": "signage/chimatsushima" }
]
```
（ページ実装の計画で必要な写真が増えたら、この表に追記して再実行する）

`assets-pipeline/scripts/optimize-source.mts`:
```ts
import path from "node:path";
import { readFileSync, existsSync } from "node:fs";
import { optimizeImage } from "./lib/optimize";

const root = process.cwd();
const map: { src: string; out: string }[] = JSON.parse(readFileSync(path.join(root, "assets-pipeline/source-map.json"), "utf8"));

let failed = 0;
for (const entry of map) {
  const src = path.join(root, "images", entry.src);
  if (!existsSync(src)) {
    console.error(`missing: ${entry.src}`);
    failed++;
    continue;
  }
  const out = await optimizeImage(src, path.join(root, "public/images/source", entry.out), { maxEdge: 2560 });
  console.log(`ok: ${entry.src} -> ${path.relative(root, out)}`);
}
if (failed) process.exit(1);
```

- [ ] **Step 6: 実行して確認**

Run: `pnpm assets:source`
Expected: 17 行の `ok:`、終了コード 0。`du -sh public/images/source` が 10MB 未満。

- [ ] **Step 7: Commit**

```bash
git add assets-pipeline/scripts/lib/optimize.ts assets-pipeline/scripts/optimize-source.mts assets-pipeline/source-map.json public/images/source tests/assets/optimize.test.ts
git commit -m "feat: add source photo optimization pipeline"
```

---

### Task 10: Codex 画像生成パイプライン（TDD）

**Files:**
- Create: `assets-pipeline/scripts/lib/brief.ts`, `assets-pipeline/scripts/gen.mts`, `assets-pipeline/scripts/adopt.mts`, `assets-pipeline/briefs/_style.json`, `assets-pipeline/briefs/test-texture.json`, `assets-pipeline/manifest.json`, `assets-pipeline/tasks/.gitkeep`, `tests/assets/brief.test.ts`

- [ ] **Step 1: 失敗するテストを書く**

`tests/assets/brief.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { BriefSchema, composePrompt, buildCodexArgs, recordAdoption, briefHash, type Style } from "@/assets-pipeline/scripts/lib/brief";

const style: Style = {
  description: "clean white corporate, navy-to-sky blue accents",
  negative: ["text", "watermark"],
};

const brief = BriefSchema.parse({
  id: "hero-city",
  purpose: "トップのヒーロー背景",
  page: "/",
  aspect: "16:9",
  size: "1536x864",
  prompt: "Sendai Kokubuncho street at dusk, soft bokeh",
  negative: ["people faces"],
  variants: 3,
});

describe("brief pipeline", () => {
  it("variants の既定値は 3", () => {
    const b = BriefSchema.parse({ id: "x", purpose: "p", page: "/", aspect: "1:1", size: "1024x1024", prompt: "p" });
    expect(b.variants).toBe(3);
    expect(b.negative).toEqual([]);
  });

  it("共通スタイルとブリーフを合成し、保存先と禁止事項を含める", () => {
    const p = composePrompt(brief, style, "C:/repo/assets-pipeline/generated/hero-city");
    expect(p).toContain("Sendai Kokubuncho street at dusk");
    expect(p).toContain("clean white corporate");
    expect(p).toContain("text, watermark, people faces");
    expect(p).toContain("C:/repo/assets-pipeline/generated/hero-city/v1.png");
    expect(p).toContain("C:/repo/assets-pipeline/generated/hero-city/v3.png");
    expect(p).toContain("Do not create, modify or delete any other file");
  });

  it("codex exec の引数を作る", () => {
    expect(buildCodexArgs("C:/repo", "PROMPT", "C:/repo/assets-pipeline/generated/hero-city/_last.txt")).toEqual([
      "exec",
      "-C", "C:/repo",
      "-s", "workspace-write",
      "--enable", "image_generation",
      "-o", "C:/repo/assets-pipeline/generated/hero-city/_last.txt",
      "PROMPT",
    ]);
  });

  it("採用記録はブリーフのハッシュを持ち、同じ id は上書きする", () => {
    const at = "2026-09-23T00:00:00.000Z";
    const m1 = recordAdoption([], brief, "v2", "public/images/generated/hero-city.webp", at);
    const m2 = recordAdoption(m1, brief, "v3", "public/images/generated/hero-city.webp", at);
    expect(m2).toHaveLength(1);
    expect(m2[0]).toEqual({ id: "hero-city", variant: "v3", output: "public/images/generated/hero-city.webp", briefHash: briefHash(brief), adoptedAt: at });
    expect(briefHash(brief)).toMatch(/^[0-9a-f]{64}$/);
  });
});
```

- [ ] **Step 2: 失敗を確認**

Run: `pnpm test tests/assets/brief.test.ts`
Expected: FAIL（モジュールなし）

- [ ] **Step 3: 実装**

`assets-pipeline/scripts/lib/brief.ts`:
```ts
import { z } from "zod";
import { createHash } from "node:crypto";

export const BriefSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  purpose: z.string().min(1),
  page: z.string().min(1),
  aspect: z.string().regex(/^\d+:\d+$/),
  size: z.string().regex(/^\d+x\d+$/),
  prompt: z.string().min(1),
  negative: z.array(z.string()).default([]),
  variants: z.number().int().min(1).max(6).default(3),
});
export type Brief = z.infer<typeof BriefSchema>;

export const StyleSchema = z.object({
  description: z.string().min(1),
  negative: z.array(z.string()).default([]),
});
export type Style = z.infer<typeof StyleSchema>;

export type ManifestEntry = { id: string; variant: string; output: string; briefHash: string; adoptedAt: string };

export function composePrompt(brief: Brief, style: Style, outDir: string): string {
  const files = Array.from({ length: brief.variants }, (_, i) => `${outDir}/v${i + 1}.png`);
  const negative = [...style.negative, ...brief.negative].join(", ");
  return [
    `Use your image generation tool to create ${brief.variants} distinct variations of one image.`,
    `Purpose: ${brief.purpose} (page ${brief.page}).`,
    `Subject: ${brief.prompt}`,
    `Shared art direction: ${style.description}`,
    `Aspect ratio ${brief.aspect}, target size ${brief.size}.`,
    `Avoid: ${negative}.`,
    `Save the results as PNG files at exactly these paths (create the folder if needed):`,
    ...files.map((f) => `- ${f}`),
    `Do not create, modify or delete any other file in the repository. When finished, reply with the list of saved paths.`,
  ].join("\n");
}

export function buildCodexArgs(repoRoot: string, prompt: string, lastMessageFile: string): string[] {
  return ["exec", "-C", repoRoot, "-s", "workspace-write", "--enable", "image_generation", "-o", lastMessageFile, prompt];
}

export function briefHash(brief: Brief): string {
  return createHash("sha256").update(JSON.stringify(brief)).digest("hex");
}

export function recordAdoption(manifest: ManifestEntry[], brief: Brief, variant: string, output: string, adoptedAt: string): ManifestEntry[] {
  const entry: ManifestEntry = { id: brief.id, variant, output, briefHash: briefHash(brief), adoptedAt };
  return [...manifest.filter((m) => m.id !== brief.id), entry];
}
```

- [ ] **Step 4: テスト通過を確認**

Run: `pnpm test tests/assets/brief.test.ts`
Expected: 4 passed

- [ ] **Step 5: CLI を作る**

`assets-pipeline/scripts/gen.mts`（使い方: `pnpm assets:gen <briefId> [<briefId>...]`、複数指定で並列実行）:
```ts
import path from "node:path";
import { spawn } from "node:child_process";
import { readFileSync, mkdirSync } from "node:fs";
import { BriefSchema, StyleSchema, composePrompt, buildCodexArgs } from "./lib/brief";

const root = process.cwd().replace(/\\/g, "/");
const ids = process.argv.slice(2);
if (ids.length === 0) {
  console.error("usage: pnpm assets:gen <briefId> [...]");
  process.exit(1);
}

const style = StyleSchema.parse(JSON.parse(readFileSync(`${root}/assets-pipeline/briefs/_style.json`, "utf8")));

function run(id: string): Promise<number> {
  const brief = BriefSchema.parse(JSON.parse(readFileSync(`${root}/assets-pipeline/briefs/${id}.json`, "utf8")));
  const outDir = `${root}/assets-pipeline/generated/${id}`;
  mkdirSync(outDir, { recursive: true });
  const args = buildCodexArgs(root, composePrompt(brief, style, outDir), `${outDir}/_last.txt`);
  return new Promise((resolve) => {
    const child = spawn("codex", args, { stdio: ["ignore", "inherit", "inherit"], shell: process.platform === "win32" });
    child.on("close", (code) => {
      console.log(`[${id}] codex exited with ${code}`);
      resolve(code ?? 1);
    });
  });
}

const codes = await Promise.all(ids.map(run));
process.exit(codes.some((c) => c !== 0) ? 1 : 0);
```

注意: Windows で `shell: true` のとき引数中の改行・引用符が壊れる場合がある。Step 8 のスモーク実行で壊れたら、プロンプトを `stdin` で渡す形（`args` の最後を `"-"` にし、`child.stdin.end(prompt)`）へ変更し、`buildCodexArgs` とテストも合わせて更新する。

`assets-pipeline/scripts/adopt.mts`（使い方: `pnpm assets:adopt <briefId> <variant>` 例 `v2`）:
```ts
import path from "node:path";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { BriefSchema, recordAdoption, type ManifestEntry } from "./lib/brief";
import { optimizeImage } from "./lib/optimize";

const [id, variant] = process.argv.slice(2);
if (!id || !/^v\d+$/.test(variant ?? "")) {
  console.error("usage: pnpm assets:adopt <briefId> <vN>");
  process.exit(1);
}

const root = process.cwd();
const src = path.join(root, "assets-pipeline/generated", id, `${variant}.png`);
if (!existsSync(src)) {
  console.error(`not found: ${src}`);
  process.exit(1);
}

const brief = BriefSchema.parse(JSON.parse(readFileSync(path.join(root, "assets-pipeline/briefs", `${id}.json`), "utf8")));
const out = await optimizeImage(src, path.join(root, "public/images/generated", id), { maxEdge: 2560 });
const manifestPath = path.join(root, "assets-pipeline/manifest.json");
const manifest: ManifestEntry[] = JSON.parse(readFileSync(manifestPath, "utf8"));
const next = recordAdoption(manifest, brief, variant, path.relative(root, out).replace(/\\/g, "/"), new Date().toISOString());
writeFileSync(manifestPath, JSON.stringify(next, null, 2) + "\n");
console.log(`adopted ${id} ${variant} -> ${path.relative(root, out)}`);
```

- [ ] **Step 6: 共通スタイル・テスト用ブリーフ・manifest を作る**

`assets-pipeline/briefs/_style.json`:
```json
{
  "description": "Premium Japanese corporate visual for YUEI JAPAN Inc., a company in Kokubuncho, Sendai. Clean white base with generous negative space, accents in deep navy (#000F50), royal blue (#0D3192) and sky blue (#B8DDF3). Soft, diffused light, subtle glass and light-refraction textures, crisp modern photography or refined 3D. Sophisticated, trustworthy, forward-looking.",
  "negative": ["text", "letters", "logos", "watermark", "low quality", "oversaturated neon", "cartoon"]
}
```

`assets-pipeline/briefs/test-texture.json`（パイプラインのスモーク確認用）:
```json
{
  "id": "test-texture",
  "purpose": "パイプライン動作確認用の抽象テクスチャ",
  "page": "none",
  "aspect": "1:1",
  "size": "1024x1024",
  "prompt": "Abstract soft gradient of translucent blue glass squares floating upward over white",
  "variants": 1
}
```

`assets-pipeline/manifest.json`:
```json
[]
```

```bash
touch assets-pipeline/tasks/.gitkeep
```

- [ ] **Step 7: 型・テスト確認**

Run: `pnpm typecheck && pnpm test`
Expected: 成功

- [ ] **Step 8: スモーク実行（実際に Codex を呼ぶ）**

Run: `pnpm assets:gen test-texture`
Expected: `[test-texture] codex exited with 0`、かつ `assets-pipeline/generated/test-texture/v1.png` が存在する。
- ファイルが所定の場所に無い場合: `assets-pipeline/generated/test-texture/_last.txt` を読み、Codex が保存した実際の場所を確認する。Codex が既定の場所（例: `~/.codex/` 配下）にしか保存しない場合は、`composePrompt` に「生成後、シェルコマンドで上記パスへコピーすること」を追記し、テストに `expect(p).toContain("copy")` を加えてから再実行する。
- 画像を目視確認（Read ツールで開く）してから次へ。

- [ ] **Step 9: 採用フローの確認**

Run: `pnpm assets:adopt test-texture v1`
Expected: `public/images/generated/test-texture.webp` が生成され、`assets-pipeline/manifest.json` に1件記録される。
確認後、テスト用の成果物を戻す:
```bash
rm public/images/generated/test-texture.webp
echo "[]" > assets-pipeline/manifest.json
```

- [ ] **Step 10: Commit**

```bash
git add assets-pipeline tests/assets/brief.test.ts package.json
git commit -m "feat: add Codex image generation and adoption pipeline"
```

---

### Task 11: CI・GitHub 反映・Vercel 接続

**Files:**
- Create: `.github/workflows/ci.yml`

- [ ] **Step 1: CI を作る**

`.github/workflows/ci.yml`:
```yaml
name: CI
on:
  pull_request:
  push:
    branches: [main]
jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 10
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm typecheck
      - run: pnpm lint
      - run: pnpm test
      - run: pnpm exec playwright install --with-deps chromium webkit
      - run: pnpm e2e
        env:
          CI: "true"
```

- [ ] **Step 2: ローカルで全検証**

Run: `pnpm typecheck && pnpm lint && pnpm test && pnpm build && pnpm e2e`
Expected: 全て成功

- [ ] **Step 3: Commit して push**

```bash
git add .github
git commit -m "ci: add typecheck, lint, unit and e2e workflow"
git push -u origin main
```
（このリポジトリは空のため、初回のみ main へ直接 push する。以降は AGENTS.md のブランチ運用に従う）

- [ ] **Step 4: CI の結果を確認**

Run: `gh run watch --exit-status`
Expected: CI 成功

- [ ] **Step 5: Vercel プロジェクトを作成して接続**

Vercel MCP（`list_teams` → `create_git_project`、リポジトリ `rocken318/yuei-hp`、Framework: Next.js）で作成する。作成前にユーザーへ対象チームを確認する。

- [ ] **Step 6: プレビュー確認**

デプロイ完了後、発行 URL をモバイル幅（390px）とデスクトップ幅で開き、ヘッダー・モバイルメニュー・スクロールリビールが動くことを目視確認する。URL をユーザーに共有する。
