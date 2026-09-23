import { describe, it, expect } from "vitest";
import { formatNumber } from "@/lib/effects/number";

describe("formatNumber", () => {
  it("3桁区切りのカンマを入れる", () => {
    expect(formatNumber(0)).toBe("0");
    expect(formatNumber(999)).toBe("999");
    expect(formatNumber(1000)).toBe("1,000");
    expect(formatNumber(1234567)).toBe("1,234,567");
  });

  it("整数に丸める（アニメーション途中の小数を表示しない）", () => {
    expect(formatNumber(3.4)).toBe("3");
    expect(formatNumber(3.6)).toBe("4");
    expect(formatNumber(1234.5)).toBe("1,235");
  });

  it("負の 0 を表示しない", () => {
    expect(formatNumber(-0.2)).toBe("0");
  });
});
