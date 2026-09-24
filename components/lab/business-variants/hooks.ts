"use client";

import { useState, type RefObject } from "react";
import { useMotionValueEvent, type MotionValue } from "motion/react";
import { useLenis } from "lenis/react";
import { activeIndex } from "./progress";

/**
 * The item nearest to a continuous position, as React state: re-renders only
 * when the index changes (counters, dots, which card is interactive).
 */
export function useActiveIndex(position: MotionValue<number>, count: number): number {
  const [index, setIndex] = useState(() => activeIndex(position.get(), count));
  useMotionValueEvent(position, "change", (v) => {
    const next = activeIndex(v, count);
    setIndex((prev) => (prev === next ? prev : next));
  });
  return index;
}

/**
 * Scrolls the window so that a pinned section (`section`, holding a sticky
 * 100svh `stage`) sits at `progress` of its ["start start", "end end"] range.
 * Smooth through Lenis when it runs, native otherwise (instant under
 * reduced motion, where Lenis is off and the global CSS drops smooth scroll).
 */
export function useScrollToProgress(
  section: RefObject<HTMLElement | null>,
  stage: RefObject<HTMLElement | null>,
) {
  const lenis = useLenis();
  return (progress: number) => {
    const el = section.current;
    const pinned = stage.current;
    if (!el || !pinned) return;
    const top = el.getBoundingClientRect().top + window.scrollY;
    // The stage is h-svh: its height is the stable viewport height.
    const y = top + progress * (el.offsetHeight - pinned.offsetHeight);
    if (lenis) lenis.scrollTo(y);
    else window.scrollTo({ top: y, behavior: "smooth" });
  };
}
