"use client";

import type { LenisOptions } from "lenis";
import { ReactLenis } from "lenis/react";
import { MotionConfig, useReducedMotion } from "motion/react";

// Touch scrolling is intentionally left native: no `syncTouch`. Lenis only
// smooths desktop wheel/trackpad input and anchor-link scrolling; phones and
// tablets keep the OS's own momentum scrolling untouched.
const lenisOptions: LenisOptions = {
  autoRaf: true,
  lerp: 0.1,
  anchors: { offset: -80 },
  stopInertiaOnNavigate: true,
  allowNestedScroll: true,
};

export function SmoothScroll({ children }: { children: React.ReactNode }) {
  const reduced = useReducedMotion();

  return (
    <MotionConfig reducedMotion="user">
      {reduced ? (
        children
      ) : (
        <ReactLenis root options={lenisOptions}>
          {children}
        </ReactLenis>
      )}
    </MotionConfig>
  );
}
