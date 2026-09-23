import type { HTMLMotionProps } from "motion/react";

// `Variants` is not re-exported by the installed motion (framer-motion 13.4.1)
// package — it only lives in the internal `motion-dom` dependency, which is
// not a direct dependency of this project and therefore cannot be imported
// by name. We derive an equivalent type from `HTMLMotionProps`, which *is*
// exported, so the shape stays in sync with what `motion.div` etc. accept.
export type RevealVariants = NonNullable<HTMLMotionProps<"div">["variants"]>;

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

export function revealVariants(reduced: boolean): RevealVariants {
  return {
    hidden: { opacity: 0, y: reduced ? 0 : 32 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: reduced ? duration.fast : duration.base, ease: ease.out },
    },
  };
}
