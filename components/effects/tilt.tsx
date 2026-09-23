"use client";

// Inspired by 21st.dev tilt cards, self-built.

import { useRef, type PointerEvent, type ReactNode } from "react";
import {
  animate,
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "motion/react";
import { cn } from "@/lib/utils";
import { duration, ease } from "@/lib/motion";
import { FINE_HOVER_QUERY, useMediaQuery } from "@/lib/effects/hooks";

export type TiltProps = {
  children: ReactNode;
  className?: string;
  /** Max rotation in degrees. */
  maxTilt?: number;
  /** Show the moving light sheen. */
  sheen?: boolean;
};

const SPRING = { stiffness: 200, damping: 20, mass: 0.5 };

/**
 * Pointer-following 3D tilt + sheen. Active only on fine-pointer/hover
 * devices without reduced motion. Elsewhere children render untilted; on
 * touch a subtle press-scale is the alternative feedback (AGENTS.md).
 * The DOM structure is identical in every mode so children never remount.
 */
export function Tilt({ children, className, maxTilt = 6, sheen = true }: TiltProps) {
  const ref = useRef<HTMLDivElement>(null);
  const fineHover = useMediaQuery(FINE_HOVER_QUERY);
  const reduced = useReducedMotion();
  const enabled = fineHover && !reduced;

  // Pointer position within the element, 0..1 (0.5 = centre).
  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);
  const sx = useSpring(px, SPRING);
  const sy = useSpring(py, SPRING);
  const rotateX = useTransform(sy, [0, 1], [maxTilt, -maxTilt]);
  const rotateY = useTransform(sx, [0, 1], [-maxTilt, maxTilt]);
  const glareX = useTransform(sx, (v) => v * 100);
  const glareY = useTransform(sy, (v) => v * 100);
  const glareOpacity = useMotionValue(0);
  const glareOpacitySpring = useSpring(glareOpacity, SPRING);
  const background = useMotionTemplate`radial-gradient(circle at ${glareX}% ${glareY}%, color-mix(in oklab, var(--color-surface) 45%, transparent), transparent 60%)`;

  function onPointerMove(e: PointerEvent<HTMLDivElement>) {
    if (!enabled || e.pointerType !== "mouse" || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    px.set((e.clientX - rect.left) / rect.width);
    py.set((e.clientY - rect.top) / rect.height);
    glareOpacity.set(1);
  }

  // Touch alternative: a subtle press-scale (manual, so the wrapper does not
  // become focusable the way whileTap would make it).
  const pressScale = useMotionValue(1);
  function press(e: PointerEvent<HTMLDivElement>) {
    if (reduced || e.pointerType === "mouse") return;
    animate(pressScale, 0.98, { duration: duration.fast, ease: ease.out });
  }
  function release() {
    if (pressScale.get() !== 1) {
      animate(pressScale, 1, { duration: duration.fast, ease: ease.out });
    }
  }

  function onPointerLeave() {
    px.set(0.5);
    py.set(0.5);
    glareOpacity.set(0);
    release();
  }

  return (
    <motion.div
      ref={ref}
      className={cn("relative", className)}
      style={
        enabled
          ? { rotateX, rotateY, transformPerspective: 900, transformStyle: "preserve-3d" }
          : { scale: pressScale }
      }
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      onPointerDown={press}
      onPointerUp={release}
      onPointerCancel={release}
    >
      {children}
      {enabled && sheen ? (
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-[inherit] mix-blend-soft-light"
          style={{ background, opacity: glareOpacitySpring }}
        />
      ) : null}
    </motion.div>
  );
}

export default Tilt;
