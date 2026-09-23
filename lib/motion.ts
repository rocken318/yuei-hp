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
