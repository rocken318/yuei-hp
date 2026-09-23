import { describe, expect, it } from "vitest";
import { MARK_PIECES, MARK_VIEWBOX, PILLAR_FACES } from "@/lib/brand/mark-geometry";

const EPS = 1e-3;
const inViewBox = ([x, y]: readonly [number, number]) =>
  x >= MARK_VIEWBOX.x - EPS &&
  y >= MARK_VIEWBOX.y - EPS &&
  x <= MARK_VIEWBOX.x + MARK_VIEWBOX.width + EPS &&
  y <= MARK_VIEWBOX.y + MARK_VIEWBOX.height + EPS;

describe("mark geometry", () => {
  it("has 6 quadrilateral pieces inside the viewBox", () => {
    expect(MARK_PIECES).toHaveLength(6);
    for (const piece of MARK_PIECES) {
      expect(piece.points).toHaveLength(4);
      for (const p of piece.points) expect(inViewBox(p)).toBe(true);
    }
  });

  it("gives every piece a non-degenerate gradient vector", () => {
    for (const { gradient: g } of MARK_PIECES) {
      expect(Math.hypot(g.x2 - g.x1, g.y2 - g.y1)).toBeGreaterThan(1);
    }
  });

  it("has 3 pillar faces inside the viewBox", () => {
    expect(PILLAR_FACES.map((f) => f.name)).toEqual(["left", "right", "top"]);
    for (const face of PILLAR_FACES) {
      expect(face.points.length).toBeGreaterThanOrEqual(4);
      for (const p of face.points) expect(inViewBox(p)).toBe(true);
    }
  });
});
