import type { Business } from "@/lib/content";
import { titleParts } from "@/components/sections/business/title-parts";

/**
 * Data and pure scroll math for the home page's business prism
 * (businesses-prism.tsx). No React, no DOM: unit-tested in
 * tests/sections/businesses-prism.test.ts.
 */

/** The serializable subset of a business the (client) prism renders. */
export type PrismBusiness = {
  slug: string;
  /** Displayed title: brand ?? name. */
  title: string;
  /** Line-break units of `title` (see components/sections/business/title-parts.ts). */
  titleParts: string[];
  /** The formal business name when a brand is shown as the title. */
  subName?: string;
  nameEn: string;
  lead?: string;
  summary: string;
  heroImage?: string;
  href: string;
};

export function toPrismBusiness(b: Business): PrismBusiness {
  const title = b.brand ?? b.name;
  return {
    slug: b.slug,
    title,
    titleParts: titleParts(title, b.titleDisplay),
    subName: b.brand ? b.name : undefined,
    nameEn: b.nameEn,
    lead: b.lead,
    summary: b.summary,
    heroImage: b.heroImage,
    href: `/business/${b.slug}`,
  };
}

export const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

const round = (n: number) => Math.round(n * 100) / 100;

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
 * of stepPosition, used by the list / dots to jump to a business.
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
 * One face of a four-sided prism turning around its vertical axis, at signed
 * distance `d` (in faces) from the front: its yaw in degrees (90° per face),
 * its opacity (faces past the side are hidden) and the opacity of the navy
 * veil that dims it as it turns away (0 at the front, `maxVeil` edge-on).
 */
export function prismFace(d: number, maxVeil = 0.45): { yaw: number; opacity: number; veil: number } {
  const turn = Math.min(1, Math.abs(d));
  return {
    yaw: round(d * 90),
    opacity: 1 - clamp01(Math.abs(d) - 1.2),
    // 1 - cos easing: the front face stays clear early in a turn, the veil
    // deepens as the face goes edge-on.
    veil: round((1 - Math.cos((turn * Math.PI) / 2)) * maxVeil),
  };
}

/**
 * How far (0..1) a turning prism is between two faces at continuous
 * `position`: 0 when a face is square to the viewer, 1 half-way (45°), as a
 * smooth sine bump. Used to pull the phone prism back while it turns, so the
 * corner coming forward does not push the faces past the screen edges.
 */
export function prismTurn(position: number): number {
  const frac = position - Math.floor(position);
  return round(Math.sin(frac * Math.PI) * 1000) / 1000;
}
