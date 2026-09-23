"use client";

import { motion } from "motion/react";
import { revealVariants } from "@/lib/motion";

type Props = {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  as?: "div" | "section" | "li";
};

/**
 * Scroll-triggered reveal for content blocks (cards, sections, list items).
 * Do not wrap the LCP element / hero headline in this — it delays first paint
 * of content that should be visible immediately.
 *
 * Reduced motion is handled globally by `<MotionConfig reducedMotion="user">`
 * in SmoothScroll, which drops the transform and keeps the fade. Branching on
 * useReducedMotion() here would render different initial styles on the
 * server and client (hydration mismatch).
 */
export function Reveal({ children, className, delay = 0, as = "div" }: Props) {
  const Component = motion[as];
  return (
    <Component
      className={className}
      data-reveal
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.15, margin: "0px 0px -10% 0px" }}
      variants={revealVariants(false, delay)}
    >
      {children}
    </Component>
  );
}
