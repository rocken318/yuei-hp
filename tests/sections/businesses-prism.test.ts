import { describe, it, expect } from "vitest";
import {
  activeIndex,
  prismFace,
  prismTurn,
  progressForStep,
  stepPosition,
  toPrismBusiness,
} from "@/components/sections/home/businesses-prism-model";
import type { Business } from "@/lib/content";

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

describe("prismFace", () => {
  it("正面は回転なし・ヴェールなし・不透明", () => {
    expect(prismFace(0)).toEqual({ yaw: 0, opacity: 1, veil: 0 });
  });

  it("1 面ごとに 90°、符号付き", () => {
    expect(prismFace(1).yaw).toBe(90);
    expect(prismFace(-0.5).yaw).toBe(-45);
  });

  it("ヴェールは向きに対して単調増加し、真横で最大", () => {
    let prev = -1;
    for (let d = 0; d <= 1; d += 0.05) {
      const { veil } = prismFace(d, 0.4);
      expect(veil).toBeGreaterThanOrEqual(prev);
      expect(prismFace(-d, 0.4).veil).toBe(veil);
      prev = veil;
    }
    expect(prismFace(1, 0.4).veil).toBeCloseTo(0.4);
    expect(prismFace(0.2, 0.4).veil).toBeLessThan(0.03);
  });

  it("裏側の面は消える", () => {
    expect(prismFace(1).opacity).toBe(1);
    expect(prismFace(2.2).opacity).toBe(0);
    expect(prismFace(-3).opacity).toBe(0);
  });
});

describe("prismTurn", () => {
  it("面が正対していれば 0、45° で 1", () => {
    expect(prismTurn(0)).toBe(0);
    expect(prismTurn(2)).toBe(0);
    expect(prismTurn(0.5)).toBe(1);
    expect(prismTurn(1.5)).toBe(1);
  });

  it("0〜1 に収まり、半分の前後で対称", () => {
    for (let p = 0; p <= 3; p += 0.07) {
      expect(prismTurn(p)).toBeGreaterThanOrEqual(0);
      expect(prismTurn(p)).toBeLessThanOrEqual(1);
    }
    expect(prismTurn(0.2)).toBeCloseTo(prismTurn(0.8));
  });
});

describe("toPrismBusiness", () => {
  const base = {
    slug: "nightlife",
    name: "ナイトエンターテインメント事業",
    nameEn: "Nightlife",
    summary: "概要",
  } as unknown as Business;

  it("ブランドがなければ事業名を表示し、/business/<slug> へリンク", () => {
    const b = toPrismBusiness(base);
    expect(b.title).toBe("ナイトエンターテインメント事業");
    expect(b.subName).toBeUndefined();
    expect(b.href).toBe("/business/nightlife");
    expect(b.titleParts.join("")).toBe(b.title);
  });

  it("ブランドがあればブランド名を表示し、事業名を副題に。titleDisplay で改行位置を決める", () => {
    const b = toPrismBusiness({ ...base, brand: "ユーエイWeb", titleDisplay: "ユーエイ|Web" } as Business);
    expect(b.title).toBe("ユーエイWeb");
    expect(b.subName).toBe("ナイトエンターテインメント事業");
    expect(b.titleParts).toEqual(["ユーエイ", "Web"]);
  });
});
