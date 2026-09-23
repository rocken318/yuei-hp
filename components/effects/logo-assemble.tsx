"use client";

import { useEffect, useId, useRef, useState, type RefObject } from "react";
import {
  animate,
  cancelFrame,
  clamp,
  cubicBezier,
  frame,
  motion,
  useInView,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useTransform,
  type MotionValue,
} from "motion/react";
import { MARK_PIECES, MARK_VIEWBOX, PILLAR_FACES, type Point } from "@/lib/brand/mark-geometry";
import { useGated, useMotionActive } from "@/lib/effects/hooks";
import { delay, duration, ease } from "@/lib/motion";
import { cn } from "@/lib/utils";

/**
 * Where each piece floats before it is assembled, as fractions of the stage
 * (the element passed as `stageRef`). `x`/`y` is the piece centre, `size`
 * its width relative to the stage's short-ish side (height on landscape,
 * width on portrait), `rotate` in degrees.
 */
type Scatter = { x: number; y: number; size: number; rotate: number };

// Landscape stages (tablet/desktop): the pieces mingle with the glass cubes
// that burst up-right from the photographed pillar.
const SCATTER_WIDE: readonly Scatter[] = [
  { x: 0.6, y: 0.4, size: 0.17, rotate: -16 },
  { x: 0.71, y: 0.2, size: 0.13, rotate: 22 },
  { x: 0.83, y: 0.36, size: 0.11, rotate: -28 },
  { x: 0.78, y: 0.62, size: 0.14, rotate: 14 },
  { x: 0.92, y: 0.2, size: 0.12, rotate: -10 },
  { x: 0.95, y: 0.5, size: 0.1, rotate: 30 },
];

// Portrait stages (phones): the headline owns the lower half, so the pieces
// spread across the upper half around the pillar's top.
const SCATTER_TALL: readonly Scatter[] = [
  { x: 0.34, y: 0.25, size: 0.2, rotate: -14 },
  { x: 0.14, y: 0.16, size: 0.15, rotate: 20 },
  { x: 0.56, y: 0.14, size: 0.13, rotate: -26 },
  { x: 0.76, y: 0.33, size: 0.2, rotate: 12 },
  { x: 0.87, y: 0.16, size: 0.15, rotate: -8 },
  { x: 0.9, y: 0.45, size: 0.12, rotate: 28 },
];

/** Arrival order: alternate the two chains, bottom (closest to the pillar) first. */
const ORDER = [0, 3, 1, 4, 2, 5] as const;
const START = 0.04;
const STAGGER = 0.05;
const TRAVEL = 0.4; // last piece lands at 0.04 + 5 * 0.05 + 0.4 = 0.69
/** Progress at which every piece is home (the idle float has faded out). */
const ASSEMBLED_AT = START + (ORDER.length - 1) * STAGGER + TRAVEL;

const PILLAR_IN: [number, number] = [0.02, 0.42];

const easeInOut = cubicBezier(...ease.inOut);
const VBW = MARK_VIEWBOX.width;
const VBH = MARK_VIEWBOX.height;

function bbox(points: readonly Point[]) {
  const xs = points.map((p) => p[0]);
  const ys = points.map((p) => p[1]);
  const x = Math.min(...xs);
  const y = Math.min(...ys);
  return { x, y, w: Math.max(...xs) - x, h: Math.max(...ys) - y };
}

const PIECE_BOXES = MARK_PIECES.map((p) => bbox(p.points));
const toAttr = (points: readonly Point[]) => points.map((p) => p.join(",")).join(" ");

type PieceLayout = { dx: number; dy: number; scale: number; rotate: number };
type Layout = { pieces: PieceLayout[]; float: number } | null;

type Props = {
  /** 0 = scattered, ~0.7+ = assembled. */
  progress: MotionValue<number>;
  /** The element the scatter positions are relative to (the hero stage). */
  stageRef: RefObject<HTMLElement | null>;
  className?: string;
};

/**
 * The YUEI mark, re-drawn as native SVG, whose six flying pieces start
 * scattered across the stage and fly onto the pillar as `progress` goes to
 * ~0.7. The element itself is the assembled mark's box (size it with
 * `className`); pieces are translated out of it, so its ancestors up to the
 * stage must not clip overflow.
 *
 * Server and first client render are identical (everything invisible, at
 * rest) to avoid a hydration mismatch; the layout is measured and the pieces
 * faded in after mount. Reduced motion: the assembled mark, static.
 */
export function LogoAssemble({ progress, stageRef, className }: Props) {
  const reduced = useReducedMotion() ?? false;
  const boxRef = useRef<HTMLDivElement>(null);
  const layout = useMotionValue<Layout>(null);
  const appear = useMotionValue(0);
  // SSR / hydration / reduced motion: assembled.
  const active = useMotionActive();
  const p = useGated(progress, active, 1);

  // Clock for the idle float. It only ticks while the float can be seen:
  // stage in view, motion allowed, and pieces not yet all home — otherwise no
  // frame callback is registered at all (no perpetual frame loop).
  const clock = useMotionValue(0);
  const inView = useInView(stageRef);
  const [assembled, setAssembled] = useState(false);
  useMotionValueEvent(p, "change", (v) => setAssembled(v >= ASSEMBLED_AT));
  const floating = inView && !reduced && !assembled;
  useEffect(() => {
    if (!floating) return;
    const tick: Parameters<typeof frame.update>[0] = ({ delta }) => clock.set(clock.get() + delta);
    frame.update(tick, true);
    return () => cancelFrame(tick);
  }, [floating, clock]);

  useEffect(() => {
    const box = boxRef.current;
    const stage = stageRef.current;
    if (!box || !stage) return;

    const measure = () => {
      // offsetLeft/Top ignore transforms, so parallax on ancestors doesn't
      // skew the measurement.
      let left = 0;
      let top = 0;
      let el: HTMLElement | null = box;
      while (el && el !== stage) {
        left += el.offsetLeft;
        top += el.offsetTop;
        el = el.offsetParent as HTMLElement | null;
      }
      const sw = stage.clientWidth;
      const sh = stage.clientHeight;
      const s = box.offsetWidth / VBW;
      const wide = sw >= sh * 0.9;
      const scatter = wide ? SCATTER_WIDE : SCATTER_TALL;
      const base = wide ? sh : sw;
      layout.set({
        float: base * 0.012,
        pieces: PIECE_BOXES.map((b, i) => {
          const sc = scatter[i];
          return {
            dx: sc.x * sw - (left + (b.x + b.w / 2) * s),
            dy: sc.y * sh - (top + (b.y + b.h / 2) * s),
            scale: (sc.size * base) / (b.w * s),
            rotate: sc.rotate,
          };
        }),
      });
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(stage);
    ro.observe(box);
    const controls = animate(appear, 1, { duration: duration.slow, ease: ease.out, delay: delay.beat });
    return () => {
      ro.disconnect();
      controls.stop();
    };
  }, [stageRef, layout, appear]);

  const pillarOpacity = useTransform(p, PILLAR_IN, [0, 1]);
  const pillarY = useTransform(p, PILLAR_IN, ["18%", "0%"], { ease: easeInOut });
  // The pillar only shows once the layout is known, like the pieces.
  const pillarAlpha = useTransform(() => pillarOpacity.get() * appear.get());

  return (
    <div ref={boxRef} data-testid="logo-mark" aria-hidden className={cn("relative aspect-[148.638/172.6681]", className)}>
      <motion.svg
        viewBox={`0 0 ${VBW} ${VBH}`}
        className="absolute inset-0 size-full overflow-visible"
        style={{ opacity: pillarAlpha, y: pillarY }}
      >
        {PILLAR_FACES.map((f) => (
          <polygon key={f.name} points={toAttr(f.points)} style={{ fill: FACE_FILL[f.name] }} />
        ))}
      </motion.svg>
      {MARK_PIECES.map((piece, i) => (
        <Piece key={i} index={i} p={p} layout={layout} clock={clock} appear={appear} />
      ))}
    </div>
  );
}

const FACE_FILL = {
  left: "var(--color-brand-navy)",
  right: "var(--color-brand-blue)",
  top: "color-mix(in oklab, var(--color-brand-blue) 82%, var(--color-brand-sky))",
} as const;

type PieceProps = {
  index: number;
  p: MotionValue<number>;
  layout: MotionValue<Layout>;
  clock: MotionValue<number>;
  appear: MotionValue<number>;
};

function Piece({ index, p, layout, clock, appear }: PieceProps) {
  // React ids may contain characters that are awkward inside url(#...).
  const gradId = `mark-grad-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const piece = MARK_PIECES[index];
  const b = PIECE_BOXES[index];
  const order = ORDER.indexOf(index as (typeof ORDER)[number]);
  const start = START + order * STAGGER;
  const phase = index * 1.7;

  // 0 = scattered, 1 = home.
  const t = useTransform(() => easeInOut(clamp(0, 1, (p.get() - start) / TRAVEL)));
  // Idle float, fading out as the piece travels home. Reduced motion: p is
  // pinned at 1 (home), so it is 0; the clock doesn't tick either.
  const drift = useTransform(() => Math.sin(clock.get() / 1100 + phase) * (1 - t.get()));

  const x = useTransform(() => (layout.get()?.pieces[index].dx ?? 0) * (1 - t.get()));
  const y = useTransform(() => {
    const l = layout.get();
    const home = t.get();
    const d = drift.get();
    return l ? l.pieces[index].dy * (1 - home) + d * l.float : 0;
  });
  const scale = useTransform(() => {
    const s = layout.get()?.pieces[index].scale ?? 1;
    return s + (1 - s) * t.get();
  });
  const rotate = useTransform(() => (layout.get()?.pieces[index].rotate ?? 0) * (1 - t.get()) + drift.get() * 3);
  const opacity = useTransform(() => {
    // Staggered fade-in on load.
    const a = clamp(0, 1, appear.get() * 1.6 - order * 0.12);
    const l = layout.get();
    return l ? a : 0;
  });

  const g = piece.gradient;
  return (
    <motion.div
      data-piece
      className="absolute will-change-transform"
      style={{
        left: `${(b.x / VBW) * 100}%`,
        top: `${(b.y / VBH) * 100}%`,
        width: `${(b.w / VBW) * 100}%`,
        height: `${(b.h / VBH) * 100}%`,
        x,
        y,
        scale,
        rotate,
        opacity,
      }}
    >
      <svg viewBox={`${b.x} ${b.y} ${b.w} ${b.h}`} className="block size-full overflow-visible">
        <defs>
          <linearGradient id={gradId} gradientUnits="userSpaceOnUse" x1={g.x1} y1={g.y1} x2={g.x2} y2={g.y2}>
            <stop offset="0" style={{ stopColor: "var(--color-brand-sky)" }} />
            <stop offset="0.72" style={{ stopColor: "var(--color-brand-blue)" }} />
            <stop
              offset="1"
              style={{ stopColor: "color-mix(in oklab, var(--color-brand-blue) 70%, var(--color-brand-navy))" }}
            />
          </linearGradient>
        </defs>
        <polygon points={toAttr(piece.points)} fill={`url(#${gradId})`} />
      </svg>
    </motion.div>
  );
}
