"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useMotionValue, useReducedMotion, useTransform, type MotionValue } from "motion/react";

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

/** A motion value, or a function computing one from other motion values. */
export type GateSource<T> = MotionValue<T> | (() => T);

/**
 * Reader for a value that follows `source` while `active` is 1 and sits at
 * `rest` otherwise. The source is read BEFORE `active`: computed motion values
 * only subscribe to the values read on their first run (when `active` is
 * still 0 during SSR/hydration), so branching first would leave the result
 * deaf to the source forever.
 */
export function gate<T>(source: GateSource<T>, active: MotionValue<number>, rest: T): () => T {
  return () => {
    const value = typeof source === "function" ? source() : source.get();
    return active.get() ? value : rest;
  };
}

/**
 * `source` while motion may run (see useMotionActive), `rest` on the server,
 * during hydration and under reduced motion.
 */
export function useGated<T>(source: GateSource<T>, active: MotionValue<number>, rest: T): MotionValue<T> {
  return useTransform(gate(source, active, rest));
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
