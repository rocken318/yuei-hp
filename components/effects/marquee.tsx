"use client";

// Inspired by https://21st.dev (infinite text marquee / scroll-velocity marquee), self-built.

import { useRef, type ReactNode } from "react";
import {
  motion,
  useAnimationFrame,
  useInView,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  useVelocity,
  wrap,
} from "motion/react";
import { cn } from "@/lib/utils";

export type MarqueeProps = {
  children: ReactNode;
  /** Base speed in % of one copy's width per second. Negative = move right. */
  baseVelocity?: number;
  /** How many copies to render (≥2). Each copy should be at least viewport-wide. */
  repeat?: number;
  /** Extra speed multiplier per 1000px/s of page scroll velocity. */
  scrollBoost?: number;
  className?: string;
  trackClassName?: string;
};

/**
 * Infinite horizontal loop. Speeds up with page scroll velocity and flips
 * direction with scroll direction. Static under reduced motion.
 * Only transforms are written (motion values, no React re-renders).
 */
export function Marquee({
  children,
  baseVelocity = 4,
  repeat = 4,
  scrollBoost = 4,
  className,
  trackClassName,
}: MarqueeProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const inView = useInView(rootRef);
  const reduced = useReducedMotion();
  const copies = Math.max(2, Math.floor(repeat));

  const baseX = useMotionValue(0);
  const { scrollY } = useScroll();
  const scrollVelocity = useVelocity(scrollY);
  const smoothVelocity = useSpring(scrollVelocity, { damping: 50, stiffness: 400 });
  const velocityFactor = useTransform(smoothVelocity, [0, 1000], [0, scrollBoost], {
    clamp: false,
  });

  // One copy is 100/copies % of the track; wrapping over that distance loops seamlessly.
  const copyShare = 100 / copies;
  const x = useTransform(baseX, (v) => `${wrap(-copyShare, 0, v)}%`);

  const direction = useRef(1);
  useAnimationFrame((_, delta) => {
    if (reduced || !inView) return;
    const factor = velocityFactor.get();
    if (factor < 0) direction.current = -1;
    else if (factor > 0) direction.current = 1;
    let moveBy = direction.current * -baseVelocity * copyShare * (delta / 1000) / 100;
    moveBy += moveBy * Math.abs(factor);
    baseX.set(baseX.get() + moveBy);
  });

  return (
    <div ref={rootRef} className={cn("overflow-hidden", className)}>
      <motion.div
        className={cn("flex w-max flex-nowrap will-change-transform", trackClassName)}
        style={{ x }}
      >
        {Array.from({ length: copies }, (_, i) => (
          <div key={i} className="flex shrink-0" aria-hidden={i > 0 ? true : undefined}>
            {children}
          </div>
        ))}
      </motion.div>
    </div>
  );
}

export default Marquee;
