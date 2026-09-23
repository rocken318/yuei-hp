/**
 * Brand colors as literal values, for renderers without CSS variables
 * (next/og share images). Mirrors the tokens in app/globals.css — kept in
 * sync by tests/brand/colors.test.ts. Everywhere else, use the CSS tokens.
 */
export const BRAND_COLORS = {
  surface: "#ffffff",
  ink: "#231815",
  inkMuted: "#5b6573",
  navy: "#000f50",
  blue: "#0d3192",
  sky: "#b8ddf3",
} as const;

/** `a` mixed with `b` in sRGB (`weight` = share of `a`, 0–1) → "#rrggbb". */
export function mixHex(a: string, b: string, weight: number): string {
  const rgb = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const [ca, cb] = [rgb(a), rgb(b)];
  return `#${ca
    .map((v, i) => Math.round(v * weight + cb[i] * (1 - weight)).toString(16).padStart(2, "0"))
    .join("")}`;
}
