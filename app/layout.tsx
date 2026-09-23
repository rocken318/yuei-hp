import type { Metadata } from "next";
import { Noto_Sans_JP, Zen_Kaku_Gothic_New, Space_Grotesk } from "next/font/google";
import { SmoothScroll } from "@/components/providers/smooth-scroll";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
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
      <head>
        <noscript>
          <style>{"[data-reveal]{opacity:1!important;transform:none!important}"}</style>
        </noscript>
      </head>
      <body className="bg-surface text-ink">
        <SmoothScroll>
          <SiteHeader />
          <main>{children}</main>
          <SiteFooter />
        </SmoothScroll>
      </body>
    </html>
  );
}
