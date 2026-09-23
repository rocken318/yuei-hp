import { describe, it, expect } from "vitest";
import path from "node:path";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { createContentRepo } from "@/lib/content/repo";

const fixtures = path.join(__dirname, "../fixtures/content");

describe("createContentRepo", () => {
  const repo = createContentRepo(fixtures);

  it("事業を order 順に返す", () => {
    expect(repo.getBusinesses().map((b) => b.slug)).toEqual(["dining", "signage"]);
  });

  it("slug で事業を1件取得し、無ければ undefined", () => {
    expect(repo.getBusiness("signage")?.brand).toBe("遊栄ビジョン");
    expect(repo.getBusiness("digital")).toBeUndefined();
  });

  it("事業ごとの拠点を order 順に返し、本文を含む", () => {
    const venues = repo.getVenues("dining");
    expect(venues.map((v) => v.slug)).toEqual(["en", "danke"]);
    expect(venues[1].body.trim()).toBe("暖家の本文");
  });

  it("拠点を1件取得できる", () => {
    expect(repo.getVenue("dining", "en")?.name).toBe("焼肉En");
    expect(repo.getVenue("dining", "nope")).toBeUndefined();
  });

  it("スキーマ違反のファイルはファイル名付きで例外になる", () => {
    const dir = mkdtempSync(path.join(tmpdir(), "content-"));
    mkdirSync(path.join(dir, "businesses"));
    writeFileSync(path.join(dir, "businesses", "bad.json"), JSON.stringify({ slug: "bad" }));
    expect(() => createContentRepo(dir).getBusinesses()).toThrow(/bad\.json/);
  });
});
