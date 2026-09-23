"use client";

// Inspired by https://21st.dev/@magicui/components/number-ticker (self-built).

import { useEffect, useRef } from "react";
import { animate, motion, useInView, useMotionValue, useReducedMotion, useTransform } from "motion/react";
import { cn } from "@/lib/utils";
import { duration, ease } from "@/lib/motion";
import { formatNumber } from "@/lib/effects/number";

export type NumberTickerProps = {
  value: number;
  className?: string;
  /** Seconds to wait after entering the viewport. */
  delay?: number;
};

/**
 * Counts 0 → value once when scrolled into view.
 * The server (and no-JS / reduced motion) renders the real value; the count
 * starts from 0 only on the client. Width is reserved by an invisible copy of
 * the final value, so counting never shifts layout. The count is a motion
 * value rendered as the child of a motion.span, so motion (not React-owned
 * DOM mutation) updates the text.
 */
export function NumberTicker({ value, className, delay = 0 }: NumberTickerProps) {
  const rootRef = useRef<HTMLSpanElement>(null);
  const inView = useInView(rootRef, { once: true, amount: 0.6 });
  const reduced = useReducedMotion();
  const final = formatNumber(value);
  const count = useMotionValue(value);
  const text = useTransform(count, (v) => formatNumber(v));

  useEffect(() => {
    if (reduced) {
      count.jump(value);
      return;
    }
    // Before it is seen, show 0 so the count-up reads as a count-up.
    if (!inView) {
      count.jump(0);
      return;
    }
    const controls = animate(count, value, { delay, duration: duration.slow, ease: ease.out });
    return () => controls.stop();
  }, [count, inView, reduced, value, delay]);

  return (
    <span ref={rootRef} className={cn("inline-grid tabular-nums", className)}>
      <span className="sr-only">{final}</span>
      <span aria-hidden="true" className="invisible col-start-1 row-start-1">
        {final}
      </span>
      <motion.span data-ticker-count aria-hidden="true" className="col-start-1 row-start-1 text-right">
        {text}
      </motion.span>
    </span>
  );
}

export default NumberTicker;
