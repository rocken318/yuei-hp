import type { Variants } from "motion/react";

export const ease = {
  out: [0.22, 1, 0.36, 1],
  inOut: [0.65, 0, 0.35, 1],
  expo: [0.16, 1, 0.3, 1],
} as const;

export const duration = {
  fast: 0.25,
  base: 0.6,
  slow: 1.2,
} as const;

/** Short delays (seconds) for staggering entrance animations. */
export const delay = {
  /** A beat after mount (e.g. the hero mark fading in). */
  beat: 0.15,
  /** Secondary copy following a headline. */
  follow: 0.3,
} as const;

/** Spring presets for pointer/scroll-velocity driven values. */
export const spring = {
  /** Soft, slightly bouncy follow (tilt, sheen). */
  soft: { stiffness: 200, damping: 20, mass: 0.5 },
  /** Heavily damped smoothing (scroll velocity). */
  smooth: { stiffness: 400, damping: 50 },
} as const;

/**
 * CSS-side durations. Each is mirrored in app/globals.css as a Tailwind theme
 * variable so utilities can use them (tests/motion.test.ts keeps both in sync):
 * - hover  → `--transition-duration-hover`  (`duration-hover`)
 * - reveal → `--transition-duration-reveal` (`duration-reveal`)
 * - pulse  → `--animate-pulse-ring`          (`animate-pulse-ring`)
 * - cue    → `--animate-scroll-cue`          (`animate-scroll-cue`)
 */
export const cssDuration = {
  hover: "300ms",
  reveal: "700ms",
  pulse: "2.2s",
  cue: "2.1s",
} as const;

export function revealVariants(reduced: boolean, delay = 0): Variants {
  return {
    hidden: { opacity: 0, y: reduced ? 0 : 32 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        delay,
        duration: reduced ? duration.fast : duration.base,
        ease: ease.out,
      },
    },
  };
}
