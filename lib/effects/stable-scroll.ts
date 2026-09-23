"use client";

import { useEffect, type RefObject } from "react";
import { cancelFrame, frame, useMotionValue, useScroll, useTransform, type MotionValue } from "motion/react";
import { progressIn, resolveScrollRange, type StableScrollOffset, type Viewport } from "./scroll-offset";

export type { StableScrollOffset } from "./scroll-offset";

/**
 * Height of the small viewport (100svh): the viewport with the mobile
 * browser's toolbars shown. Unlike `innerHeight` or
 * `document.documentElement.clientHeight`, it does not change while the
 * toolbar collapses/expands on iOS Safari, and it is what every pinned stage
 * on the site is sized with (h-svh). Read from a shared, invisible probe.
 */
let probe: HTMLDivElement | null = null;
function stableViewport(): Viewport {
  const width = document.documentElement.clientWidth;
  if (typeof CSS === "undefined" || !CSS.supports("height", "100svh")) {
    return { width, height: document.documentElement.clientHeight };
  }
  if (!probe || !probe.isConnected) {
    probe = document.createElement("div");
    probe.setAttribute("aria-hidden", "true");
    probe.style.cssText =
      "position:fixed;top:0;left:0;width:0;height:100svh;visibility:hidden;pointer-events:none;";
    document.body.appendChild(probe);
  }
  return { width, height: probe.offsetHeight };
}

/** Document-relative top, ignoring transforms (like motion's useScroll). */
function documentTop(el: HTMLElement): number {
  let top = 0;
  let node: HTMLElement | null = el;
  while (node) {
    top += node.offsetTop;
    node = node.offsetParent as HTMLElement | null;
  }
  return top;
}

/**
 * Window-scroll progress (0..1) of `target` through `offset`, like
 * `useScroll({ target, offset }).scrollYProgress`, but measured against the
 * SMALL viewport (100svh) instead of the current one.
 *
 * Why: on iOS Safari `document.documentElement.clientHeight` (which motion's
 * useScroll uses as the viewport length) grows and shrinks with the toolbar.
 * The toolbar reappears when the user scrolls back up, a resize event fires,
 * and every "end"/"%" offset shifts by the toolbar height (~80px) at once, so
 * pinned scenes (hero, message, stacking cards…) jumped mid-page although the
 * scroll position had not moved. The pinned stages themselves are 100svh, so
 * svh is also the correct length for "end end" pin ranges.
 *
 * Returns 0 until the target is measured (SSR / first render); callers gate
 * it with useGated anyway.
 */
export function useStableScroll(
  target: RefObject<HTMLElement | null>,
  offset: StableScrollOffset,
): MotionValue<number> {
  // scrollY is the raw scroll position: independent of the viewport height.
  const { scrollY } = useScroll();
  const range = useMotionValue<readonly [number, number] | null>(null);
  const [from, to] = offset;

  useEffect(() => {
    const el = target.current;
    if (!el) return;
    const measure = () => {
      const next = resolveScrollRange([from, to], { top: documentTop(el), height: el.offsetHeight }, stableViewport());
      const prev = range.get();
      if (!prev || prev[0] !== next[0] || prev[1] !== next[1]) range.set(next);
    };
    const schedule = () => frame.read(measure);
    measure();
    // Re-measure when the target or anything above it changes size (fonts,
    // images, breakpoints) and on real viewport changes (rotation).
    const ro = new ResizeObserver(schedule);
    ro.observe(el);
    ro.observe(document.body);
    window.addEventListener("resize", schedule);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", schedule);
      cancelFrame(measure);
    };
  }, [target, range, from, to]);

  return useTransform(() => {
    const y = scrollY.get();
    const r = range.get();
    return r ? progressIn(y, r) : 0;
  });
}
