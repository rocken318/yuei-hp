import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it, expect } from "vitest";
import { BRAND_COLORS, mixHex } from "@/lib/brand/colors";
import { markSvg } from "@/lib/brand/mark-svg";

const css = readFileSync(path.join(__dirname, "..", "..", "app", "globals.css"), "utf8");
const token = (name: string) => new RegExp(`--color-${name}:[ ]*(#[0-9a-f]{6})`, "i").exec(css)?.[1]?.toLowerCase();

describe("BRAND_COLORS", () => {
  it("app/globals.css のトークンと一致する", () => {
    expect({
      surface: token("surface"),
      ink: token("ink"),
      inkMuted: token("ink-muted"),
      navy: token("brand-navy"),
      blue: token("brand-blue"),
      sky: token("brand-sky"),
    }).toEqual(BRAND_COLORS);
  });
});

describe("mixHex", () => {
  it("sRGB で混ぜる", () => {
    expect(mixHex("#ffffff", "#000000", 1)).toBe("#ffffff");
    expect(mixHex("#ffffff", "#000000", 0)).toBe("#000000");
    expect(mixHex("#ff0000", "#0000ff", 0.5)).toBe("#800080");
  });
});

describe("markSvg", () => {
  it("6つのグラデーション片と柱の3面を持つ単体SVG", () => {
    const svg = markSvg();
    expect(svg.startsWith('<svg xmlns="http://www.w3.org/2000/svg"')).toBe(true);
    expect(svg.match(/<linearGradient /g)).toHaveLength(6);
    expect(svg.match(/<polygon /g)).toHaveLength(9);
    expect(svg).not.toContain("var(");
  });
});
