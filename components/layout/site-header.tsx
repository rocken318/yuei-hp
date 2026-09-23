"use client";

import Link from "next/link";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";
import { useLenis } from "lenis/react";
import { navItems, contactItem } from "./nav-items";
import { duration, ease } from "@/lib/motion";

// Intrinsic size of public/brand/yuei-logo.svg (its viewBox aspect ratio).
// next/image infers `unoptimized` automatically for a ".svg" src, so no
// extra prop is needed here.
const LOGO_W = 417;
const LOGO_H = 173;

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  // True from the moment the menu opens until its close animation completes,
  // so the header background stays solid while the menu is closing and the
  // container stays mounted long enough to animate out.
  const [menuVisible, setMenuVisible] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const reduced = useReducedMotion() ?? false;
  const pathname = usePathname();
  const lenis = useLenis();
  const toggleRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  // Set by a menu link click that navigates to a different route, so the
  // pathname-change effect knows to move focus to <main> instead of leaving
  // it stranded on a menu link that just left the DOM.
  const navigatedFromMenuRef = useRef(false);

  if (open && !menuVisible) setMenuVisible(true);

  // Closes the menu. Pass `restoreFocus` when the close wasn't initiated by
  // navigating to a new page (Escape, viewport resize, or a link back to the
  // current page) so keyboard/AT focus lands back on a visible, focusable
  // control instead of vanishing with the menu.
  const close = useCallback((opts?: { restoreFocus?: boolean }) => {
    setOpen(false);
    if (opts?.restoreFocus) toggleRef.current?.focus();
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Move focus into the menu the moment it opens. Kept in its own effect,
  // keyed only on `open`, so a `lenis` instance that mounts after the menu is
  // already open doesn't re-run this and steal focus back.
  useEffect(() => {
    if (!open) return;
    menuRef.current?.querySelector<HTMLElement>("a[href]")?.focus({ preventScroll: true });
  }, [open]);

  // While the mobile menu is open: lock background scroll and make the page
  // behind it inert. Lenis (when mounted) is the primary scroll driver, so
  // pause it directly; the `overflow` toggle covers the reduced-motion case,
  // where SmoothScroll does not mount ReactLenis.
  useEffect(() => {
    if (!open) return;
    const root = document.documentElement;
    const background = Array.from(document.querySelectorAll("main, footer"));

    lenis?.stop();
    root.style.overflow = "hidden";
    background.forEach((el) => el.setAttribute("inert", ""));

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
      close({ restoreFocus: true });
    };
    const desktop = window.matchMedia("(min-width: 48rem)");
    const onBreakpoint = () => {
      if (desktop.matches) close({ restoreFocus: true });
    };
    window.addEventListener("keydown", onKeyDown);
    desktop.addEventListener("change", onBreakpoint);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      desktop.removeEventListener("change", onBreakpoint);
    };
  }, [open, close]);

  // Close whenever the route changes. Adjusted during render (not in an
  // effect) per https://react.dev/learn/you-might-not-need-an-effect —
  // comparing against the previously rendered pathname avoids the
  // cascading-render setState-in-effect pattern.
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setOpen(false);
  }

  // After a menu-link navigation actually lands (pathname committed), move
  // focus to <main> rather than leaving it on the now-unmounted menu link.
  useEffect(() => {
    if (!navigatedFromMenuRef.current) return;
    navigatedFromMenuRef.current = false;
    document.getElementById("main")?.focus();
  }, [pathname]);

  const solid = scrolled || open || menuVisible;
  const closedStyle = reduced ? { opacity: 0 } : { clipPath: "inset(0 0 100% 0)" };
  const openStyle = reduced ? { opacity: 1 } : { clipPath: "inset(0 0 0% 0)" };

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
          <Link href="/" aria-label="遊栄JAPAN トップへ" onClick={() => close()}>
            <Image
              src="/brand/yuei-logo.svg"
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
            <Link href={contactItem.href} className="rounded-full bg-brand-blue px-5 py-2 text-sm font-medium text-surface hover:bg-brand-navy">
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

      {/* Disclosure pattern, not a dialog: the toggle button above (with
          aria-expanded/aria-controls) is the only control that opens/closes
          this, and it deliberately lives outside this container so it never
          gets hidden from AT along with the menu (iOS VoiceOver otherwise
          loses the close control once the panel is marked as a modal
          dialog). `inert` on main/footer above provides the modal-like
          scroll/focus trap while open; this container itself stays a plain
          labelled nav landmark. Presence is keyed on `menuVisible` (not
          `open`) and the close transition is driven by `animate` rather than
          AnimatePresence's `exit`, so this element keeps re-rendering with
          fresh props — including `inert`/`aria-hidden` — throughout the
          close animation instead of freezing at its last pre-close props. */}
      {menuVisible && (
        <motion.div
          ref={menuRef}
          id="mobile-menu"
          inert={!open ? true : undefined}
          aria-hidden={!open ? true : undefined}
          data-lenis-prevent
          className="fixed inset-x-0 top-16 bottom-0 z-40 overflow-y-auto overscroll-contain bg-surface px-6 pt-10 pb-[max(2.5rem,env(safe-area-inset-bottom))] outline-none md:hidden"
          initial={closedStyle}
          animate={open ? openStyle : closedStyle}
          onAnimationComplete={() => {
            if (!open) setMenuVisible(false);
          }}
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
                  <Link
                    href={item.href}
                    onClick={() => {
                      if (item.href === pathname) {
                        close({ restoreFocus: true });
                      } else {
                        navigatedFromMenuRef.current = true;
                        close();
                      }
                    }}
                    className="block"
                  >
                    <span className="block font-display text-3xl font-bold text-brand-navy">{item.en}</span>
                    <span className="text-sm text-ink-muted">{item.label}</span>
                  </Link>
                </motion.li>
              ))}
            </ul>
          </nav>
        </motion.div>
      )}
    </>
  );
}
