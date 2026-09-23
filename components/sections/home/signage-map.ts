/**
 * Geometry of the YUEI VISION "イメージ図" map (home §5), in viewBox units
 * (400 × 300, landscape). This is an illustrative sketch agreed with the
 * client — street order and pin sides are meaningful, distances are not.
 *
 *   定禅寺通り (left, vertical) · 広瀬通り (right, vertical)
 *   国分町通り (main, horizontal, upper-middle) · 晩翠通り (horizontal, lower)
 *   The three 国分町通り pins share one row just above the street (same y);
 *   晩翠通り's vision sits just below 晩翠通り. On that row the middle pin's
 *   label is "raised" (a second label row, joined by a leader line) so the
 *   three names never collide, even on a 390px phone.
 */

export const MAP_VIEWBOX = { width: 400, height: 300 } as const;

/** Top band kept free of lines for the avenue / area labels. */
export const MAP_HEADER = 30;

export type Street = {
  id: string;
  /** Name drawn on the map; unnamed minor streets have none. */
  label?: string;
  axis: "x" | "y";
  /** x for vertical streets (axis "x"), y for horizontal ones (axis "y"). */
  at: number;
  weight: "main" | "major" | "minor";
};

export const STREETS = {
  jozenji: { id: "jozenji", label: "定禅寺通り", axis: "x", at: 56, weight: "major" },
  hirose: { id: "hirose", label: "広瀬通り", axis: "x", at: 344, weight: "major" },
  kokubuncho: { id: "kokubuncho", label: "国分町通り", axis: "y", at: 140, weight: "main" },
  bansui: { id: "bansui", label: "晩翠通り", axis: "y", at: 250, weight: "major" },
} as const satisfies Record<string, Street>;

/** Unnamed side streets, for the grid feel. */
export const MINOR_STREETS: readonly Street[] = [
  { id: "h1", axis: "y", at: 178, weight: "minor" },
  { id: "h2", axis: "y", at: 214, weight: "minor" },
  { id: "v1", axis: "x", at: 158, weight: "minor" },
  { id: "v2", axis: "x", at: 262, weight: "minor" },
];

export const ALL_STREETS: readonly Street[] = [...MINOR_STREETS, ...Object.values(STREETS)];

/** Where a street's name sits: percent of the map box, centred on the point. */
export const STREET_LABELS: { id: keyof typeof STREETS; x: number; y: number }[] = [
  { id: "jozenji", x: STREETS.jozenji.at, y: MAP_HEADER / 2 },
  { id: "hirose", x: STREETS.hirose.at, y: MAP_HEADER / 2 },
  { id: "kokubuncho", x: 262, y: STREETS.kokubuncho.at },
  { id: "bansui", x: 262, y: STREETS.bansui.at },
];

export type PinSide = "above" | "raised" | "right" | "below";
export type MapPin = { x: number; y: number; side: PinSide };

const span = STREETS.hirose.at - STREETS.jozenji.at;
const chimatsushimaX = STREETS.jozenji.at + span * 0.2;
/** The 国分町通り row: just above the street. */
const kokubunchoRowY = STREETS.kokubuncho.at - 20;

/** Pin per venue slug (viewBox units). `side` is where the name label goes. */
export const MAP_PINS: Record<string, MapPin> = {
  chimatsushima: { x: chimatsushimaX, y: kokubunchoRowY, side: "above" },
  peace: { x: STREETS.jozenji.at + span * 0.5, y: kokubunchoRowY, side: "raised" },
  eiraku: { x: STREETS.hirose.at - 20, y: kokubunchoRowY, side: "above" },
  bansui: { x: chimatsushimaX, y: STREETS.bansui.at + 22, side: "right" },
};

/** Spare spots for venues without a dedicated pin (never expected). */
const FALLBACK_PINS: MapPin[] = [
  { x: 110, y: 196, side: "right" },
  { x: 210, y: 196, side: "right" },
];

export function pinFor(slug: string, index: number): MapPin {
  return MAP_PINS[slug] ?? FALLBACK_PINS[index % FALLBACK_PINS.length];
}

/** viewBox units → CSS percent of the map box. */
export const pctX = (x: number) => `${(x / MAP_VIEWBOX.width) * 100}%`;
export const pctY = (y: number) => `${(y / MAP_VIEWBOX.height) * 100}%`;
