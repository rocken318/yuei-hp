import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { ease, duration, revealVariants, cssDuration, spring, delay } from "@/lib/motion";

const css = readFileSync(path.join(process.cwd(), "app/globals.css"), "utf8");
const cssVar = (name: string) => css.match(new RegExp(`${name}:\\s*([^;]+);`))?.[1].trim();

describe("motion tokens", () => {
  it("イージングと時間はそれぞれ3種類に限定", () => {
    expect(Object.keys(ease)).toEqual(["out", "inOut", "expo"]);
    expect(Object.keys(duration)).toEqual(["fast", "base", "slow"]);
  });
  it("spring / delay プリセットが定義されている", () => {
    expect(spring.soft).toMatchObject({ stiffness: expect.any(Number), damping: expect.any(Number) });
    expect(spring.smooth).toMatchObject({ stiffness: expect.any(Number), damping: expect.any(Number) });
    expect(delay.beat).toBeLessThan(delay.follow);
  });
  it("globals.css の CSS 変数が lib/motion.ts と一致する", () => {
    expect(cssVar("--ease-brand-out")).toBe(`cubic-bezier(${ease.out.join(", ")})`);
    expect(cssVar("--ease-brand-in-out")).toBe(`cubic-bezier(${ease.inOut.join(", ")})`);
    expect(cssVar("--transition-duration-hover")).toBe(cssDuration.hover);
    expect(cssVar("--transition-duration-reveal")).toBe(cssDuration.reveal);
    expect(cssVar("--animate-pulse-ring")).toContain(` ${cssDuration.pulse} `);
    expect(cssVar("--animate-scroll-cue")).toContain(` ${cssDuration.cue} `);
    expect(cssVar("--animate-scroll-cue")).toContain(`cubic-bezier(${ease.inOut.join(", ")})`);
  });
  it("scroll cue は slow×1.5 の移動 + 0.3s の休止", () => {
    expect(parseFloat(cssDuration.cue)).toBeCloseTo(duration.slow * 1.5 + 0.3);
  });
  it("reveal は下から浮かび上がり、reduced のときは移動しない", () => {
    expect(revealVariants(false).hidden).toMatchObject({ opacity: 0, y: 32 });
    expect(revealVariants(true).hidden).toMatchObject({ opacity: 0, y: 0 });
  });
  it("visible の transition には delay と duration が含まれる", () => {
    expect(revealVariants(false, 0.2).visible).toMatchObject({
      transition: { delay: 0.2, duration: 0.6 },
    });
  });
  it("reduced のときも delay は保持され、duration だけ短縮される", () => {
    expect(revealVariants(true, 0.2).visible).toMatchObject({
      transition: { delay: 0.2, duration: 0.25 },
    });
  });
});
