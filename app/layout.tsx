import type { Metadata } from "next";
import { Zen_Kaku_Gothic_New, Space_Grotesk } from "next/font/google";
import { SmoothScroll } from "@/components/providers/smooth-scroll";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import "./globals.css";

// Japanese web fonts ship ~120 unicode-range files per weight, and every
// range a page uses is fetched on first paint (Lighthouse counted 450-750 KB
// of font files ahead of FCP). So only the headings use a web font (Zen Kaku
// Gothic New, bold only); body text uses the platform's Japanese
// system font (see --font-sans in globals.css). No preload: the browser
// fetches only the ranges the page actually uses.
const zenKaku = Zen_Kaku_Gothic_New({ subsets: ["latin"], weight: ["700"], variable: "--font-zen-kaku", display: "swap", preload: false });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], weight: ["400", "500", "700"], variable: "--font-space-grotesk", display: "swap" });

export const metadata: Metadata = {
  title: { default: "遊栄Japan株式会社", template: "%s | 遊栄JAPAN" },
  description: "仙台・国分町を拠点に、ナイトエンターテインメント・飲食・デジタルサイネージ・Web開発を展開する遊栄Japan株式会社のコーポレートサイト。",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" className={`${zenKaku.variable} ${spaceGrotesk.variable}`}>
      <head>
        <noscript>
          <style>{"[data-reveal]{opacity:1!important;transform:none!important}"}</style>
        </noscript>
      </head>
      <body className="bg-surface text-ink">
        <SmoothScroll>
          <SiteHeader />
          <main
            id="main"
            tabIndex={-1}
            className="outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue"
          >
            {children}
          </main>
          <SiteFooter />
        </SmoothScroll>
      </body>
    </html>
  );
}
