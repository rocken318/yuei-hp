import { BRAND_COLORS as C, mixHex } from "./colors";
import { MARK_PIECES, MARK_VIEWBOX, PILLAR_FACES, type Point } from "./mark-geometry";

const toAttr = (points: readonly Point[]) => points.map(([x, y]) => `${x},${y}`).join(" ");

/** Same fills as components/effects/logo-assemble.tsx, as literal colors. */
const FACE_FILL = { left: C.navy, right: C.blue, top: mixHex(C.blue, C.sky, 0.82) } as const;
const PIECE_DARK_END = mixHex(C.blue, C.navy, 0.7);

/**
 * The assembled YUEI mark as a standalone SVG document (gradients inline),
 * for renderers that take an image (next/og). The page uses LogoAssemble.
 */
export function markSvg(): string {
  const { x, y, width, height } = MARK_VIEWBOX;
  const gradients = MARK_PIECES.map(
    ({ gradient: g }, i) =>
      `<linearGradient id="p${i}" gradientUnits="userSpaceOnUse" x1="${g.x1}" y1="${g.y1}" x2="${g.x2}" y2="${g.y2}">` +
      `<stop offset="0" stop-color="${C.sky}"/><stop offset="0.72" stop-color="${C.blue}"/><stop offset="1" stop-color="${PIECE_DARK_END}"/>` +
      `</linearGradient>`,
  ).join("");
  const pieces = MARK_PIECES.map((p, i) => `<polygon points="${toAttr(p.points)}" fill="url(#p${i})"/>`).join("");
  const faces = PILLAR_FACES.map((f) => `<polygon points="${toAttr(f.points)}" fill="${FACE_FILL[f.name]}"/>`).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${x} ${y} ${width} ${height}"><defs>${gradients}</defs>${faces}${pieces}</svg>`;
}

/** markSvg() as a data: URI. */
export function markDataUri(): string {
  return `data:image/svg+xml;base64,${Buffer.from(markSvg()).toString("base64")}`;
}
