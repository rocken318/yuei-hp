import { describe, it, expect } from "vitest";
import { BriefSchema, composePrompt, buildCodexArgs, recordAdoption, briefHash, type Style } from "@/assets-pipeline/scripts/lib/brief";

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
  });

  it("codex exec の引数を作る（プロンプトは stdin で渡すため末尾は '-'）", () => {
    expect(buildCodexArgs("C:/repo", "C:/repo/assets-pipeline/generated/hero-city/_last.txt")).toEqual([
      "exec",
      "-C", "C:/repo",
      "-s", "workspace-write",
      "--enable", "image_generation",
      "-o", "C:/repo/assets-pipeline/generated/hero-city/_last.txt",
      "-",
    ]);
  });

  it("採用記録はブリーフのハッシュを持ち、同じ id は上書きする", () => {
    const at = "2026-09-23T00:00:00.000Z";
    const m1 = recordAdoption([], brief, "v2", "public/images/generated/hero-city.webp", at);
    const m2 = recordAdoption(m1, brief, "v3", "public/images/generated/hero-city.webp", at);
    expect(m2).toHaveLength(1);
    expect(m2[0]).toEqual({ id: "hero-city", variant: "v3", output: "public/images/generated/hero-city.webp", briefHash: briefHash(brief), adoptedAt: at });
    expect(briefHash(brief)).toMatch(/^[0-9a-f]{64}$/);
  });
});
