/** Clamps `i` into 0..count-1 (0 for an empty list). */
export function clampIndex(i: number, count: number): number {
  if (count <= 0) return 0;
  return Math.min(count - 1, Math.max(0, Math.round(i)));
}

/**
 * Index of the snapped item in a horizontal scroll-snap row whose items are
 * `step` px apart (item width + gap). When the row is scrolled to its end the
 * last item counts as current, even if it can't reach the snap start (wide
 * viewports show several items at once).
 */
export function snapIndex(opts: { scrollLeft: number; maxScroll: number; step: number; count: number }): number {
  const { scrollLeft, maxScroll, step, count } = opts;
  if (count <= 0 || step <= 0) return 0;
  if (maxScroll > 0 && scrollLeft >= maxScroll - 2) return count - 1;
  return clampIndex(scrollLeft / step, count);
}

/** Horizontal swipe distance (px) that turns the lightbox to the next image. */
export const SWIPE_THRESHOLD = 48;

/**
 * Direction of a horizontal swipe: 1 (next, finger moved left), -1 (previous)
 * or 0 (too short, or more vertical than horizontal).
 */
export function swipeDirection(dx: number, dy: number, threshold = SWIPE_THRESHOLD): -1 | 0 | 1 {
  if (Math.abs(dx) < threshold || Math.abs(dx) < Math.abs(dy)) return 0;
  return dx < 0 ? 1 : -1;
}
