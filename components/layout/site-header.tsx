"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useLenis } from "lenis/react";
import { navItems, contactItem } from "./nav-items";
import { duration, ease } from "@/lib/motion";

// Intrinsic size of public/brand/yuei-logo.png (confirmed via sharp metadata).
const LOGO_W = 1200;
const LOGO_H = 497;

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const reduced = useReducedMotion() ?? false;
  const pathname = usePathname();
  const lenis = useLenis();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Lock background scroll while the mobile menu is open. Lenis (when mounted)
  // is the primary scroll driver, so pause/resume it directly; the
  // `documentElement.style.overflow` toggle is kept as a fallback for the
  // reduced-motion case, where SmoothScroll does not mount ReactLenis at all.
  useEffect(() => {
    if (open) {
      lenis?.stop();
      document.documentElement.style.overflow = "hidden";
    } else {
      lenis?.start();
      document.documentElement.style.overflow = "";
    }
    return () => {
      lenis?.start();
      document.documentElement.style.overflow = "";
    };
  }, [open, lenis]);

  // Close on Escape.
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  // Close whenever the route changes. Adjusted during render (not in an
  // effect) per https://react.dev/learn/you-might-not-need-an-effect —
  // comparing against the previously rendered pathname avoids the
  // cascading-render setState-in-effect pattern.
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setOpen(false);
  }

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors ${scrolled || open ? "bg-surface/80 backdrop-blur-md border-b border-line" : "bg-transparent"}`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 md:h-20 md:px-8">
        <Link href="/" aria-label="遊栄JAPAN トップへ" onClick={() => setOpen(false)}>
          <Image
            src="/brand/yuei-logo.png"
            alt="遊栄JAPAN"
            width={LOGO_W}
            height={LOGO_H}
            preload
            className="h-8 w-auto md:h-10"
          />
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
