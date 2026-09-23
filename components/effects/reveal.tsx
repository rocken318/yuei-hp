"use client";

import { motion, useReducedMotion } from "motion/react";
import { revealVariants } from "@/lib/motion";

type Props = {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  as?: "div" | "section" | "li";
};

export function Reveal({ children, className, delay = 0, as = "div" }: Props) {
  const reduced = useReducedMotion() ?? false;
  const Component = motion[as];
  return (
    <Component
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.3 }}
      variants={revealVariants(reduced)}
      transition={{ delay }}
    >
      {children}
    </Component>
  );
}
