import { describe, it, expect } from "vitest";
import {
  BriefSchema,
  composePrompt,
  buildCodexArgs,
  recordAdoption,
  briefHash,
  styleHash,
  parseVariant,
  ManifestEntrySchema,
  type Style,
} from "@/assets-pipeline/scripts/lib/brief";

const style: Style = {
  description: "clean white corporate, navy-to-sky blue accents",
  negative: ["text", "watermark"],
};

const brief = BriefSchema.parse({
  id: "hero-city",
  purpose: "トップのヒーロー背景",
  page: "/",
  aspect: "16:9",
  size: "1536x864",
  prompt: "Sendai Kokubuncho street at dusk, soft bokeh",
  negative: ["people faces"],
  variants: 3,
});

describe("brief pipeline", () => {
  it("variants の既定値は 3", () => {
    const b = BriefSchema.parse({ id: "x", purpose: "p", page: "/", aspect: "1:1", size: "1024x1024", prompt: "p" });
    expect(b.variants).toBe(3);
    expect(b.negative).toEqual([]);
  });

  it("共通スタイルとブリーフを合成し、保存先と禁止事項を含める", () => {
    const p = composePrompt(brief, style, "C:/repo/assets-pipeline/generated/hero-city");
    expect(p).toContain("Sendai Kokubuncho street at dusk");
    expect(p).toContain("clean white corporate");
    expect(p).toContain("text, watermark, people faces");
    expect(p).toContain("C:/repo/assets-pipeline/generated/hero-city/v1.png");
    expect(p).toContain("C:/repo/assets-pipeline/generated/hero-city/v3.png");
    expect(p).toContain("Do not create, modify or delete any other file");
    expect(p).toContain("~/.codex/generated_images");
    expect(p).toContain("copy");
    expect(p).toContain("Never draw");
    expect(p).toContain("center-crop to 16:9 and resize to exactly 1536x864");
  });

  it("禁止事項は重複を除く", () => {
    const b = BriefSchema.parse({ ...brief, negative: ["text", "people faces", "text"] });
    const p = composePrompt(b, style, "/out");
    expect(p).toContain("Avoid: text, watermark, people faces.");
  });

  it("codex exec の引数を作る（プロンプトは stdin で渡すため末尾は '-'）", () => {
    expect(buildCodexArgs("C:/repo", "C:/repo/assets-pipeline/generated/hero-city/_last.txt")).toEqual([
      "exec",
      "-C", "C:/repo",
      "-s", "workspace-write",
      "--enable", "image_generation",
      "--color", "never",
      "-o", "C:/repo/assets-pipeline/generated/hero-city/_last.txt",
      "-",
    ]);
  });

  it("採用記録はブリーフとスタイルのハッシュを持ち、同じ id は上書きする", () => {
    const at = "2026-09-23T00:00:00.000Z";
    const m1 = recordAdoption([], brief, style, "v2", "public/images/generated/hero-city.webp", at);
    const m2 = recordAdoption(m1, brief, style, "v3", "public/images/generated/hero-city.webp", at);
    expect(m2).toHaveLength(1);
    expect(m2[0]).toEqual({
      id: "hero-city",
      variant: "v3",
      output: "public/images/generated/hero-city.webp",
      briefHash: briefHash(brief),
      styleHash: styleHash(style),
      adoptedAt: at,
    });
    expect(briefHash(brief)).toMatch(/^[0-9a-f]{64}$/);
    expect(styleHash(style)).toMatch(/^[0-9a-f]{64}$/);
    expect(styleHash({ ...style, description: "other" })).not.toBe(styleHash(style));
    expect(ManifestEntrySchema.array().parse(m2)).toEqual(m2);
  });

  it("ManifestEntrySchema は styleHash の欠けたエントリを拒否する", () => {
    expect(() =>
      ManifestEntrySchema.array().parse([{ id: "a", variant: "v1", output: "x", briefHash: "h", adoptedAt: "t" }])
    ).toThrow();
  });

  it("parseVariant は 1..variants の vN だけを受け付ける", () => {
    expect(parseVariant("v1", 3)).toBe(1);
    expect(parseVariant("v3", 3)).toBe(3);
    expect(parseVariant("v0", 3)).toBeNull();
    expect(parseVariant("v4", 3)).toBeNull();
    expect(parseVariant("v01", 3)).toBeNull();
    expect(parseVariant("2", 3)).toBeNull();
    expect(parseVariant(undefined, 3)).toBeNull();
  });
});
