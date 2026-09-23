"use client";

// Inspired by https://21st.dev/@magicui/components/number-ticker (self-built).

import { useEffect, useRef } from "react";
import { animate, useInView, useReducedMotion } from "motion/react";
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
 * the final value, so counting never shifts layout.
 */
export function NumberTicker({ value, className, delay = 0 }: NumberTickerProps) {
  const rootRef = useRef<HTMLSpanElement>(null);
  const countRef = useRef<HTMLSpanElement>(null);
  const inView = useInView(rootRef, { once: true, amount: 0.6 });
  const reduced = useReducedMotion();
  const final = formatNumber(value);

  // Before it is seen, show 0 so the count-up reads as a count-up.
  useEffect(() => {
    const el = countRef.current;
    if (!el || reduced || inView) return;
    el.textContent = formatNumber(0);
  }, [reduced, inView]);

  useEffect(() => {
    const el = countRef.current;
    if (!el) return;
    if (reduced) {
      el.textContent = final;
      return;
    }
    if (!inView) return;
    const controls = animate(0, value, {
      delay,
      duration: duration.slow,
      ease: ease.out,
      onUpdate: (v) => {
        el.textContent = formatNumber(v);
      },
    });
    return () => controls.stop();
  }, [inView, reduced, value, delay, final]);

  return (
    <span ref={rootRef} className={cn("inline-grid tabular-nums", className)}>
      <span className="sr-only">{final}</span>
      <span aria-hidden="true" className="invisible col-start-1 row-start-1">
        {final}
      </span>
      <span
        ref={countRef}
        aria-hidden="true"
        className="col-start-1 row-start-1 text-right"
      >
        {final}
      </span>
    </span>
  );
}

export default NumberTicker;
