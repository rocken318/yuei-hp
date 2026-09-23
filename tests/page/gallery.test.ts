import { describe, it, expect } from "vitest";
import { clampIndex, snapIndex, swipeDirection, venueGallery } from "@/lib/page/gallery";

describe("clampIndex", () => {
  it("0..count-1 に収める", () => {
    expect(clampIndex(-1, 5)).toBe(0);
    expect(clampIndex(2, 5)).toBe(2);
    expect(clampIndex(9, 5)).toBe(4);
    expect(clampIndex(3, 0)).toBe(0);
  });
});

describe("snapIndex", () => {
  const base = { maxScroll: 1000, step: 300, count: 6 };
  it("スクロール位置から最寄りの項目を求める", () => {
    expect(snapIndex({ ...base, scrollLeft: 0 })).toBe(0);
    expect(snapIndex({ ...base, scrollLeft: 140 })).toBe(0);
    expect(snapIndex({ ...base, scrollLeft: 160 })).toBe(1);
    expect(snapIndex({ ...base, scrollLeft: 610 })).toBe(2);
  });
  it("右端までスクロールしたら最後の項目", () => {
    expect(snapIndex({ ...base, scrollLeft: 999 })).toBe(5);
  });
  it("スクロールできない・空のときは 0", () => {
    expect(snapIndex({ scrollLeft: 0, maxScroll: 0, step: 300, count: 3 })).toBe(0);
    expect(snapIndex({ scrollLeft: 0, maxScroll: 0, step: 0, count: 0 })).toBe(0);
  });
});

describe("swipeDirection", () => {
  it("左へスワイプで次、右へで前", () => {
    expect(swipeDirection(-80, 5)).toBe(1);
    expect(swipeDirection(80, -5)).toBe(-1);
  });
  it("短い・縦方向が大きい動きは無視", () => {
    expect(swipeDirection(-20, 0)).toBe(0);
    expect(swipeDirection(-60, 90)).toBe(0);
  });
});

describe("venueGallery", () => {
  it("ヒーロー写真を除き、残りに通し番号の alt を付ける", () => {
    expect(venueGallery(["/a.webp", "/b.webp", "/c.webp"], "/a.webp", "店")).toEqual([
      { src: "/b.webp", alt: "店 の写真 1" },
      { src: "/c.webp", alt: "店 の写真 2" },
    ]);
  });

  it("ヒーローが無い・含まれないときはそのまま", () => {
    expect(venueGallery(["/a.webp"], undefined, "店")).toEqual([{ src: "/a.webp", alt: "店 の写真 1" }]);
    expect(venueGallery(["/a.webp"], "/x.webp", "店")).toHaveLength(1);
  });

  it("ヒーローだけの gallery は空になる", () => {
    expect(venueGallery(["/a.webp"], "/a.webp", "店")).toEqual([]);
  });
});
