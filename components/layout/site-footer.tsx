import Link from "next/link";
import Image from "next/image";
import { content } from "@/lib/content";
import { navItems, contactItem } from "./nav-items";

// Intrinsic size of public/brand/yuei-logo.svg (its viewBox aspect ratio).
const LOGO_W = 417;
const LOGO_H = 173;

/** Site footer (server component): the legal name and address come from content/company.json. */
export async function SiteFooter() {
  const company = await content.getCompany();
  return (
    <footer className="border-t border-line bg-surface-muted">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 md:grid-cols-2 md:px-8">
        <div>
          <Image src="/brand/yuei-logo.svg" alt="遊栄JAPAN" width={LOGO_W} height={LOGO_H} className="h-9 w-auto" />
          <p className="mt-3 font-display text-xl font-bold text-brand-navy">{company.nameEn}</p>
          <p className="mt-2 text-sm text-ink">{company.name}</p>
          {company.address && (
            <address className="mt-1 text-sm not-italic leading-[1.8] text-ink-muted [word-break:auto-phrase]">
              {company.address}
            </address>
          )}
        </div>
        <nav aria-label="フッターナビゲーション" className="grid grid-cols-2 gap-3 text-sm">
          {[...navItems, contactItem, { href: "/privacy", label: "プライバシーポリシー", en: "Privacy" }].map((item) => (
            <Link key={item.href} href={item.href} className="text-ink hover:text-brand-blue">
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
      <p className="border-t border-line py-6 text-center text-xs text-ink-muted">© {company.nameEn} All rights reserved.</p>
    </footer>
  );
}
