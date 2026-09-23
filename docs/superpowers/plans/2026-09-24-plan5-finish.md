# 計画5+6: お知らせ・問い合わせ・採用・SEO（仕上げ） Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development.

**Goal:** 残りのページ（お知らせ、お問い合わせ、採用、プライバシーポリシー）と SEO を整え、サイト全体を「仕上がり」状態にする。ナビのリンク切れ（404）をゼロにする。

**決定事項（2026-09-24 ユーザー）**
- 会社情報（登記）: 法人番号 4370001019890 / 遊栄Japan株式会社（ユウエイジャパン）/ 宮城県仙台市青葉区国分町2丁目8番30号 NJビル5階
- お問い合わせ: 送信先はダミー `info@example.com`。Resend の API キー（`RESEND_API_KEY`）と送信先（`CONTACT_TO`）が未設定の間は送信を無効化し「フォームは準備中です」を表示する。
- 採用: 各店舗サイトで扱う。コーポレートの `/recruit` は案内ページ（店舗一覧への導線）のみ。

---

### Task A: 会社情報・お知らせ
- `content/company.json`: `name` "遊栄Japan株式会社"、`nameKana` "ユウエイジャパン"（スキーマ追加）、`corporateNumber` "4370001019890"（スキーマ追加）、`address` 上記。
- `/about` の会社概要に 法人番号 行、アクセス節（住所＋Google マップリンク）が表示されること。フッターに社名・所在地。サイトの metadata の社名を登記表記に。
- お知らせ: `content/news/*.mdx`（`NewsSchema`: slug, title, date(YYYY-MM-DD), category("お知らせ"|"店舗"|"採用"|"メディア"), excerpt?, body）、`ContentRepo.getNews()`/`getNewsItem()`（日付降順）。
- 最初の記事: `2026-09-24-site-open.mdx`「コーポレートサイトを公開しました」（事実のみ）。
- `/news`（一覧、カテゴリ表示）、`/news/[slug]`（SSG、`dynamicParams=false`、前後記事リンク）。本文は MDX をプレーンな段落として描画（`lib/page/text.ts` の paragraphs）。
- トップに「お知らせ」セクション（最新3件、Numbers と CTA の間）。

### Task B: お問い合わせ・採用・プライバシー
- `/contact`: 種別（`?type=signage|web|other` で初期選択）・お名前・会社名（任意）・メール・電話（任意）・内容・プライバシーポリシー同意。zod で検証（クライアント・サーバー共通スキーマ `lib/contact/schema.ts`、テスト）。Server Action `app/contact/actions.ts`: `RESEND_API_KEY` と `CONTACT_TO` があれば Resend REST API（fetch）で送信、なければ `{ status: "disabled" }`。UI は未設定時に案内バナーを出し送信ボタン無効。ハニーポット項目でスパム対策（Turnstile は将来）。送信成功時は完了メッセージ。
- `/recruit`: 「採用情報は各店舗のサイトで公開予定です」＋ナイト・飲食の店舗カード（VenueSwipeList）＋お問い合わせ導線。募集中とは書かない。
- `/privacy`: 一般的な個人情報保護方針（取得する情報、利用目的＝問い合わせ対応、第三者提供、安全管理、開示請求、問い合わせ窓口＝会社名・所在地）。制定日は記載しない。
- トップ CTA の採用バナーの文言・リンクを `/recruit` の内容に合わせる。

### Task C: SEO・仕上げ（A・B の後）
- `app/sitemap.ts`（全ルート）、`app/robots.ts`、`metadataBase`（`https://yuei-hp.vercel.app`、環境変数で上書き可）、各ページ `openGraph`/`twitter`。
- OG 画像: `app/opengraph-image.tsx`（ブランドの白＋ロゴ＋キャッチ、`next/og`）。
- 構造化データ JSON-LD: トップに `Organization`（name, url, logo, address, identifier=法人番号）、各店舗ページに `LocalBusiness`（住所がある場合のみ）、事業・店舗ページに `BreadcrumbList`。
- e2e のエラー許可リストを空にし、全ルート（/news, /news/[slug], /contact, /recruit, /privacy を含む）を巡回。
- Lighthouse（モバイル）をトップと店舗ページで計測し、Performance / Accessibility / Best Practices / SEO を報告。明らかな問題は修正。
