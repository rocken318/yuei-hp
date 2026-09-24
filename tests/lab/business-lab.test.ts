import { describe, it, expect } from "vitest";
import { activeIndex, progressForStep, slantPolygon, stepPosition } from "@/components/lab/business-variants/progress";
import { parseVariant } from "@/components/lab/business-variants/variants";

describe("stepPosition", () => {
  it("両端は 0 と count-1", () => {
    expect(stepPosition(0, 4)).toBe(0);
    expect(stepPosition(1, 4)).toBe(3);
    expect(stepPosition(-1, 4)).toBe(0);
    expect(stepPosition(2, 4)).toBe(3);
  });

  it("hold=0 なら線形", () => {
    expect(stepPosition(0.5, 3, 0)).toBeCloseTo(1);
    expect(stepPosition(0.25, 3, 0)).toBeCloseTo(0.5);
  });

  it("プラトー中は整数位置で止まる", () => {
    // count 4, hold 1 → total 7 units: plateau 0 = [0,1], transition = [1,2], plateau 1 = [2,3]…
    expect(stepPosition(0.5 / 7, 4, 1)).toBe(0);
    expect(stepPosition(1.5 / 7, 4, 1)).toBeCloseTo(0.5);
    expect(stepPosition(2.5 / 7, 4, 1)).toBe(1);
  });

  it("単調増加", () => {
    let prev = -1;
    for (let p = 0; p <= 1; p += 0.01) {
      const pos = stepPosition(p, 4, 0.6);
      expect(pos).toBeGreaterThanOrEqual(prev);
      prev = pos;
    }
  });

  it("1件以下は常に 0", () => {
    expect(stepPosition(0.7, 1)).toBe(0);
    expect(stepPosition(0.7, 0)).toBe(0);
  });
});

describe("activeIndex", () => {
  it("最も近い項目に丸めて範囲内に収める", () => {
    expect(activeIndex(0.49, 4)).toBe(0);
    expect(activeIndex(0.5, 4)).toBe(1);
    expect(activeIndex(2.7, 4)).toBe(3);
    expect(activeIndex(9, 4)).toBe(3);
    expect(activeIndex(-2, 4)).toBe(0);
  });
});

describe("progressForStep", () => {
  it("stepPosition の逆写像になる", () => {
    for (const hold of [0, 0.5, 1]) {
      for (let i = 0; i < 4; i++) {
        expect(stepPosition(progressForStep(i, 4, hold), 4, hold)).toBeCloseTo(i);
      }
    }
  });

  it("最初と最後はセクションの端", () => {
    expect(progressForStep(0, 4)).toBe(0);
    expect(progressForStep(3, 4)).toBe(1);
    expect(progressForStep(7, 4)).toBe(1);
  });
});

describe("slantPolygon", () => {
  it("4 点の polygon を返し、t=1 ではボックスを覆う", () => {
    const small = slantPolygon(0);
    expect(small).toMatch(/^polygon\((?:[-\d.]+% [-\d.]+%(?:, )?){4}\)$/);
    const pts = slantPolygon(1)
      .slice(8, -1)
      .split(", ")
      .map((p) => p.split(" ").map(parseFloat));
    // Every corner lies outside the 0..100% box on both axes.
    const [tl, tr, br, bl] = pts;
    expect(tl[0]).toBeLessThan(0);
    expect(tl[1]).toBeLessThan(0);
    expect(tr[0]).toBeGreaterThan(100);
    expect(tr[1]).toBeLessThan(0);
    expect(br[0]).toBeGreaterThan(100);
    expect(br[1]).toBeGreaterThan(100);
    expect(bl[0]).toBeLessThan(0);
    expect(bl[1]).toBeGreaterThan(100);
  });
});

describe("parseVariant", () => {
  it("a〜e を受け付け、それ以外は a", () => {
    expect(parseVariant("b")).toBe("b");
    expect(parseVariant(" E ")).toBe("e");
    expect(parseVariant("z")).toBe("a");
    expect(parseVariant(null)).toBe("a");
  });
});
