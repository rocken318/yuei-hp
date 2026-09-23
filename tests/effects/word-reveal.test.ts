import { describe, it, expect } from "vitest";
import {
  segmentJa,
  getWordOpacity,
  getWordRange,
  REST_OPACITY,
} from "@/lib/effects/word-reveal";

const MESSAGE = [
  "国分町の夜から、街の未来へ。",
  "人が集い、語らい、笑顔になる場所を。",
  "飲食、エンターテインメント、デジタルサイネージ、そしてWeb。",
  "私たちは領域を越えて、この街に新しい価値を届けます。",
].join("\n");

const PUNCT = /^[\s、。，．,.!?！？」』）)]+$/u;

describe("segmentJa", () => {
  const segments = segmentJa(MESSAGE);

  it("空のセグメントを作らない", () => {
    expect(segments.length).toBeGreaterThan(10);
    for (const s of segments) expect(s.length).toBeGreaterThan(0);
  });

  it("連結すると元の文字列に戻る（空白・改行を保持）", () => {
    expect(segments.join("")).toBe(MESSAGE);
    for (const line of MESSAGE.split("\n")) {
      expect(segmentJa(line).join("")).toBe(line);
    }
  });

  it("句読点は単独のセグメントにならず、前の語に付く", () => {
    for (const s of segments) {
      expect(s).not.toMatch(PUNCT);
      expect(s[0]).not.toMatch(/[、。]/u);
    }
    expect(segments.some((s) => s.endsWith("、"))).toBe(true);
    expect(segments.some((s) => s.endsWith("。"))).toBe(true);
  });

  it("カタカナ語は途中で分割しない", () => {
    const line = segmentJa("飲食、エンターテインメント、デジタルサイネージ、そしてWeb。");
    expect(line).toContain("エンターテインメント、");
    expect(line.some((s) => s.startsWith("デジタルサイネージ"))).toBe(true);
  });

  it("英文は空白を前の語に付けて保持する", () => {
    expect(segmentJa("Hello big world.")).toEqual(["Hello ", "big ", "world."]);
  });

  it("空文字は空配列", () => {
    expect(segmentJa("")).toEqual([]);
  });
});

describe("getWordRange", () => {
  it("先頭は 0 から始まり、範囲は [0, 1] に収まる", () => {
    const count = 12;
    let prev = -1;
    for (let i = 0; i < count; i++) {
      const { start, end } = getWordRange(i, count);
      expect(start).toBeGreaterThanOrEqual(0);
      expect(end).toBeLessThanOrEqual(1);
      expect(end).toBeGreaterThan(start);
      expect(start).toBeGreaterThan(prev);
      prev = start;
    }
    expect(getWordRange(0, count).start).toBe(0);
  });

  it("最後の語は進捗 1 までに完全に表示される", () => {
    expect(getWordRange(9, 10).end).toBeLessThanOrEqual(1);
  });

  it("語が1つでも破綻しない", () => {
    const r = getWordRange(0, 1);
    expect(r.start).toBe(0);
    expect(r.end).toBeGreaterThan(0);
  });
});

describe("getWordOpacity", () => {
  const range = { start: 0.2, end: 0.4 };

  it("開始前は待機時の不透明度、終了後は 1", () => {
    expect(getWordOpacity(0, range)).toBe(REST_OPACITY);
    expect(getWordOpacity(0.2, range)).toBe(REST_OPACITY);
    expect(getWordOpacity(0.4, range)).toBe(1);
    expect(getWordOpacity(1, range)).toBe(1);
  });

  it("途中は線形補間され、常に [rest, 1] に収まる", () => {
    expect(getWordOpacity(0.3, range)).toBeCloseTo(REST_OPACITY + (1 - REST_OPACITY) / 2);
    for (let p = -0.5; p <= 1.5; p += 0.05) {
      const o = getWordOpacity(p, range);
      expect(o).toBeGreaterThanOrEqual(REST_OPACITY);
      expect(o).toBeLessThanOrEqual(1);
    }
  });

  it("rest を指定できる", () => {
    expect(getWordOpacity(0, range, 0.3)).toBe(0.3);
  });
});
