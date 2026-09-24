/**
 * Pure scroll-progress helpers shared by the business scroll lab variants
 * (components/lab/business-variants). No React, no DOM: unit-tested in
 * tests/lab/business-lab.test.ts.
 */

export const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

/**
 * Continuous position (0..count-1) of a pinned, stepped section at scroll
 * `progress` (0..1). Each item holds still for a while ("plateau") before the
 * next transition starts, so the section settles on every business instead
 * of drifting past it. `hold` is the plateau length relative to one
 * transition (0 = no plateau: position is linear in progress).
 *
 * Layout of the progress axis for count = 3, hold = h:
 *   [plateau 0: h][transition 0→1: 1][plateau 1: h][transition 1→2: 1][plateau 2: h]
 */
export function stepPosition(progress: number, count: number, hold = 0.5): number {
  if (count <= 1) return 0;
  const total = count * hold + (count - 1);
  const u = clamp01(progress) * total;
  const k = Math.min(count - 1, Math.floor(u / (hold + 1)));
  const intoTransition = u - k * (hold + 1) - hold;
  return Math.min(count - 1, k + clamp01(intoTransition));
}

/** Index of the item nearest to a continuous `position`, clamped to 0..count-1. */
export function activeIndex(position: number, count: number): number {
  if (count <= 0) return 0;
  return Math.min(count - 1, Math.max(0, Math.round(position)));
}

/**
 * Scroll progress (0..1) at the middle of item `index`'s plateau: the inverse
 * of stepPosition, used by step dots to jump to a business.
 */
export function progressForStep(index: number, count: number, hold = 0.5): number {
  if (count <= 1) return 0;
  const total = count * hold + (count - 1);
  const i = Math.min(count - 1, Math.max(0, index));
  // First and last plateaus: their outer edge (the section's start / end),
  // so a jump lands exactly where natural scrolling rests.
  if (i === 0) return 0;
  if (i === count - 1) return 1;
  return (i * (hold + 1) + hold / 2) / total;
}

/**
 * Clip-path polygon of a slanted parallelogram (like the pieces of the Yuei
 * mark: near-vertical sides leaning right, top and bottom edges rising to the
 * right), centred in its box and grown by `t` (0 = small shard, 1 = well past
 * every edge of the box, i.e. fully revealed).
 */
export function slantPolygon(t: number): string {
  const k = clamp01(t);
  const halfW = 7 + k * 78; // % of width
  const halfH = 11 + k * 84; // % of height
  const lean = 2.5 + k * 12; // horizontal lean of the sides
  const rise = 4 + k * 10; // vertical rise of the top/bottom edges
  const pt = (x: number, y: number) => `${round(50 + x)}% ${round(50 + y)}%`;
  return `polygon(${[
    pt(-halfW + lean, -halfH + rise),
    pt(halfW + lean, -halfH - rise),
    pt(halfW - lean, halfH - rise),
    pt(-halfW - lean, halfH + rise),
  ].join(", ")})`;
}

const round = (n: number) => Math.round(n * 100) / 100;
