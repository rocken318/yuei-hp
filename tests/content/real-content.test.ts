import { describe, it, expect } from "vitest";
import { existsSync } from "node:fs";
import path from "node:path";
import { content } from "@/lib/content";

describe("content/ の実データ", () => {
  it("4事業すべてが存在する", async () => {
    expect((await content.getBusinesses()).map((b) => b.slug)).toEqual(["nightlife", "dining", "signage", "digital"]);
  });
  it("拠点数が設計どおり", async () => {
    expect((await content.getVenues("nightlife")).map((v) => v.slug)).toEqual(["kingyo", "b-club", "c-girl"]);
    expect((await content.getVenues("dining")).map((v) => v.slug)).toEqual(["en", "danke"]);
    expect((await content.getVenues("signage")).map((v) => v.slug)).toEqual(["chimatsushima", "peace", "eiraku", "bansui"]);
  });
  it("全事業に heroImage があり、public/ に実在する", async () => {
    for (const b of await content.getBusinesses()) {
      expect(b.heroImage, b.slug).toMatch(/^\/images\/.+\.webp$/);
      expect(existsSync(path.join(process.cwd(), "public", b.heroImage!)), b.heroImage).toBe(true);
    }
  });
  it("拠点の heroImage（設定されていれば）が public/ に実在する", async () => {
    for (const business of ["nightlife", "dining", "signage"] as const) {
      for (const v of await content.getVenues(business)) {
        if (!v.heroImage) continue;
        expect(v.heroImage, `${business}/${v.slug}`).toMatch(/^\/images\/.+\.webp$/);
        expect(existsSync(path.join(process.cwd(), "public", v.heroImage)), v.heroImage).toBe(true);
      }
    }
  });
});
