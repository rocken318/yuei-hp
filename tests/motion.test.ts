import { describe, it, expect } from "vitest";
import { ease, duration, revealVariants } from "@/lib/motion";

describe("motion tokens", () => {
  it("イージングと時間はそれぞれ3種類に限定", () => {
    expect(Object.keys(ease)).toEqual(["out", "inOut", "expo"]);
    expect(Object.keys(duration)).toEqual(["fast", "base", "slow"]);
  });
  it("reveal は下から浮かび上がり、reduced のときは移動しない", () => {
    expect(revealVariants(false).hidden).toMatchObject({ opacity: 0, y: 32 });
    expect(revealVariants(true).hidden).toMatchObject({ opacity: 0, y: 0 });
  });
});
