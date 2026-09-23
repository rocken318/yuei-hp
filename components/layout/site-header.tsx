"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
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
  // True from the moment the menu opens until its exit animation completes,
  // so the header background stays solid while the menu is closing.
  const [menuVisible, setMenuVisible] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const reduced = useReducedMotion() ?? false;
  const pathname = usePathname();
  const lenis = useLenis();
  const toggleRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  if (open && !menuVisible) setMenuVisible(true);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // While the mobile menu is open: lock background scroll, make the page
  // behind it inert and move focus into the menu. Lenis (when mounted) is the
  // primary scroll driver, so pause it directly; the `overflow` toggle covers
  // the reduced-motion case, where SmoothScroll does not mount ReactLenis.
  useEffect(() => {
    if (!open) return;
    const root = document.documentElement;
    const background = Array.from(document.querySelectorAll("main, footer"));

    lenis?.stop();
    root.style.overflow = "hidden";
    background.forEach((el) => el.setAttribute("inert", ""));
    menuRef.current?.querySelector<HTMLElement>("a[href]")?.focus({ preventScroll: true });

    return () => {
      lenis?.start();
      root.style.overflow = "";
      background.forEach((el) => el.removeAttribute("inert"));
    };
  }, [open, lenis]);

  // Close on Escape (returning focus to the toggle), and when the viewport
  // grows past the md breakpoint where the menu is hidden by CSS.
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpen(false);
      toggleRef.current?.focus();
    };
    const desktop = window.matchMedia("(min-width: 48rem)");
    const onBreakpoint = () => {
      if (desktop.matches) setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    desktop.addEventListener("change", onBreakpoint);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      desktop.removeEventListener("change", onBreakpoint);
    };
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

  const solid = scrolled || open || menuVisible;

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50">
        {/* The background sits on its own layer: backdrop-filter on <header>
            itself would make it the containing block for fixed descendants. */}
        <div
          aria-hidden
          className={`absolute inset-0 -z-10 border-b transition-colors ${solid ? "border-line bg-surface/80 backdrop-blur-md" : "border-transparent bg-transparent"}`}
        />
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
            ref={toggleRef}
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
      </header>

      <AnimatePresence onExitComplete={() => setMenuVisible(false)}>
        {open && (
          <motion.div
            ref={menuRef}
            id="mobile-menu"
            role="dialog"
            aria-modal="true"
            aria-label="メニュー"
            data-lenis-prevent
            className="fixed inset-x-0 top-16 bottom-0 z-40 overflow-y-auto overscroll-contain bg-surface px-6 pt-10 pb-[max(2.5rem,env(safe-area-inset-bottom))] md:hidden"
            initial={reduced ? { opacity: 0 } : { clipPath: "inset(0 0 100% 0)" }}
            animate={reduced ? { opacity: 1 } : { clipPath: "inset(0 0 0% 0)" }}
            exit={reduced ? { opacity: 0 } : { clipPath: "inset(0 0 100% 0)" }}
            transition={{ duration: reduced ? duration.fast : duration.base, ease: ease.expo }}
          >
            <nav aria-label="モバイルメニュー">
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
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
