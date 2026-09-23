/**
 * Pure helpers for useStableScroll (lib/effects/stable-scroll.ts): resolve a
 * motion-style scroll offset ("<target edge> <viewport edge>") into the
 * window scroll positions where it starts and ends, and map a scroll
 * position into 0..1 progress between them.
 *
 * Edge syntax (the subset of motion's useScroll offsets): "start" | "center"
 * | "end", a fraction ("0.7"), a percentage ("85%"), or "px" / "vh" / "vw"
 * lengths. Fractions and percentages are of the target's height (target
 * edge) or of the viewport height (viewport edge).
 */

/** Two points: where progress is 0, and where it is 1. E.g. ["start start", "end end"]. */
export type StableScrollOffset = readonly [string, string];

export type Viewport = { height: number; width: number };

const NAMED: Record<string, number> = { start: 0, center: 0.5, end: 1 };

/** Pixel position of `edge` along a box of `length` px. */
export function resolveEdge(edge: string, length: number, viewport: Viewport): number {
  if (edge in NAMED) return NAMED[edge] * length;
  const n = parseFloat(edge);
  if (Number.isNaN(n)) throw new Error(`Unsupported scroll offset edge: "${edge}"`);
  if (edge.endsWith("px")) return n;
  if (edge.endsWith("%")) return (n / 100) * length;
  if (edge.endsWith("vh")) return (n / 100) * viewport.height;
  if (edge.endsWith("vw")) return (n / 100) * viewport.width;
  return n * length;
}

/**
 * Scroll position (window.scrollY) at which the target's edge meets the
 * viewport's edge, for one offset point like "start end".
 */
export function resolveOffsetPoint(
  point: string,
  target: { top: number; height: number },
  viewport: Viewport,
): number {
  const parts = point.trim().split(/\s+/);
  const [targetEdge, viewportEdge = targetEdge in NAMED ? targetEdge : "0"] = parts;
  return target.top + resolveEdge(targetEdge, target.height, viewport) - resolveEdge(viewportEdge, viewport.height, viewport);
}

/** [scrollY at progress 0, scrollY at progress 1]. */
export function resolveScrollRange(
  offset: StableScrollOffset,
  target: { top: number; height: number },
  viewport: Viewport,
): [number, number] {
  return [resolveOffsetPoint(offset[0], target, viewport), resolveOffsetPoint(offset[1], target, viewport)];
}

/** Clamped 0..1 progress of `scrollY` through `range`. */
export function progressIn(scrollY: number, [from, to]: readonly [number, number]): number {
  if (to === from) return scrollY >= to ? 1 : 0;
  return Math.min(1, Math.max(0, (scrollY - from) / (to - from)));
}
