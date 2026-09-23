"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useMotionValue, useReducedMotion, type MotionValue } from "motion/react";

/**
 * 1 when scroll/pointer-linked motion may run, 0 otherwise.
 *
 * Starts at 0 on the server and during hydration (so SSR markup shows the
 * final, static state and never mismatches), then flips to 1 after mount
 * unless the user prefers reduced motion. Being a MotionValue, it can be
 * combined into useTransform without re-rendering (AGENTS.md: scroll-linked
 * values must honour useReducedMotion themselves).
 */
export function useMotionActive(): MotionValue<number> {
  const reduced = useReducedMotion();
  const active = useMotionValue(0);
  useEffect(() => {
    active.set(reduced ? 0 : 1);
  }, [active, reduced]);
  return active;
}

/** SSR-safe matchMedia (false on the server and during hydration). */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const mql = window.matchMedia(query);
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}

export const FINE_HOVER_QUERY = "(hover: hover) and (pointer: fine)";
