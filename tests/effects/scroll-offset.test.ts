import { describe, it, expect } from "vitest";
import { progressIn, resolveEdge, resolveOffsetPoint, resolveScrollRange } from "@/lib/effects/scroll-offset";

const vp = { height: 664, width: 390 };

describe("resolveEdge", () => {
  it("名前付き・割合・%・px・vh・vw を解決する", () => {
    expect(resolveEdge("start", 1000, vp)).toBe(0);
    expect(resolveEdge("center", 1000, vp)).toBe(500);
    expect(resolveEdge("end", 1000, vp)).toBe(1000);
    expect(resolveEdge("0.7", 1000, vp)).toBeCloseTo(700);
    expect(resolveEdge("85%", 1000, vp)).toBeCloseTo(850);
    expect(resolveEdge("40px", 1000, vp)).toBe(40);
    expect(resolveEdge("50vh", 1000, vp)).toBe(332);
    expect(resolveEdge("10vw", 1000, vp)).toBe(39);
  });
  it("未知の値は例外", () => {
    expect(() => resolveEdge("middle", 100, vp)).toThrow();
  });
});

describe("resolveScrollRange", () => {
  // A 200svh pinned track starting at 1328px (the home message section).
  const track = { top: 1328, height: 1328 };

  it("start start → end end は track の高さ − ビューポート高さ（ピン留め区間）", () => {
    expect(resolveScrollRange(["start start", "end end"], track, vp)).toEqual([1328, 1328 + 664]);
  });

  it("start end → start start は 1 画面分の進入区間", () => {
    expect(resolveScrollRange(["start end", "start start"], track, vp)).toEqual([1328 - 664, 1328]);
  });

  it("ビューポート辺の % はビューポート高さに対する割合", () => {
    expect(resolveOffsetPoint("start 85%", { top: 5000, height: 300 }, vp)).toBeCloseTo(5000 - 0.85 * 664);
    expect(resolveOffsetPoint("end 45%", { top: 5000, height: 300 }, vp)).toBeCloseTo(5300 - 0.45 * 664);
  });

  it("値が 1 つだけの名前付き辺は両側に適用する（motion と同じ）", () => {
    expect(resolveOffsetPoint("end", track, vp)).toBe(1328 + 1328 - 664);
  });

  it("ビューポート高さ（svh）が同じなら結果も同じ＝ツールバーの出入りで範囲が動かない", () => {
    const a = resolveScrollRange(["start start", "end end"], track, vp);
    const b = resolveScrollRange(["start start", "end end"], track, { ...vp });
    expect(a).toEqual(b);
  });
});

describe("progressIn", () => {
  it("範囲内は線形、範囲外は 0/1 にクランプ", () => {
    expect(progressIn(1328, [1328, 1992])).toBe(0);
    expect(progressIn(1660, [1328, 1992])).toBe(0.5);
    expect(progressIn(5000, [1328, 1992])).toBe(1);
    expect(progressIn(0, [1328, 1992])).toBe(0);
  });
  it("長さ 0 の範囲はステップ", () => {
    expect(progressIn(9, [10, 10])).toBe(0);
    expect(progressIn(10, [10, 10])).toBe(1);
  });
});
