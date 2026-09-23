"use client";

import { motion, useReducedMotion } from "motion/react";
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
 */
export function Reveal({ children, className, delay = 0, as = "div" }: Props) {
  const reduced = useReducedMotion() ?? false;
  const Component = motion[as];
  return (
    <Component
      className={className}
      data-reveal
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.15, margin: "0px 0px -10% 0px" }}
      variants={revealVariants(reduced, delay)}
    >
      {children}
    </Component>
  );
}
