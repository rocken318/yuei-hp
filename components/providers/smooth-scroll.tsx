"use client";

import type { LenisOptions } from "lenis";
import { ReactLenis } from "lenis/react";
import { MotionConfig, useReducedMotion } from "motion/react";

// Touch scrolling is intentionally left native: no `syncTouch`. Lenis only
// smooths desktop wheel/trackpad input and anchor-link scrolling; phones and
// tablets keep the OS's own momentum scrolling untouched.
//
// `anchors: true` (rather than a fixed `{ offset }`) so in-page anchor jumps
// clear the fixed header at both header heights (64px mobile / 80px
// md+). Verified against lenis@1.3.26's source
// (lenis/dist/lenis.mjs, Lenis#scrollTo): when a target element is resolved,
// it reads `scroll-padding-top`/`scroll-padding-left` from
// `getComputedStyle(this.rootElement)` — `document.documentElement` for the
// default `wrapper: window` — and `scroll-margin-top` from the target,
// subtracting both before applying `offset` (which defaults to 0 when
// `anchors` is `true` rather than an options object). `app/globals.css`
// already sets `scroll-padding-top: --spacing(16)` (64px) with a
// `--spacing(20)` (80px) override at the `md` breakpoint to match the
// header's own responsive height, so `anchors: true` picks up the correct
// offset per breakpoint for free instead of hardcoding one fixed value here.
const lenisOptions: LenisOptions = {
  autoRaf: true,
  lerp: 0.1,
  anchors: true,
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
