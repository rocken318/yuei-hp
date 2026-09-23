import { describe, it, expect, afterEach } from "vitest";
import path from "node:path";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { createContentRepo } from "@/lib/content/repo";

const fixtures = path.join(__dirname, "../fixtures/content");

describe("createContentRepo", () => {
  const repo = createContentRepo(fixtures);
  const tempDirs: string[] = [];

  afterEach(() => {
    while (tempDirs.length > 0) {
      const dir = tempDirs.pop();
      if (dir) rmSync(dir, { recursive: true, force: true });
    }
  });

  function makeTempDir(): string {
    const dir = mkdtempSync(path.join(tmpdir(), "content-"));
    tempDirs.push(dir);
    return dir;
  }

  it("事業を order 順に返す", async () => {
    expect((await repo.getBusinesses()).map((b) => b.slug)).toEqual(["dining", "signage"]);
  });

  it("slug で事業を1件取得し、無ければ undefined", async () => {
    expect((await repo.getBusiness("signage"))?.brand).toBe("遊栄ビジョン");
    expect(await repo.getBusiness("digital")).toBeUndefined();
  });

  it("事業ごとの拠点を order 順に返し、本文を含む", async () => {
    const venues = await repo.getVenues("dining");
    expect(venues.map((v) => v.slug)).toEqual(["en", "danke"]);
    expect(venues[1].body.trim()).toBe("暖家の本文");
  });

  it("拠点を1件取得できる", async () => {
    expect((await repo.getVenue("dining", "en"))?.name).toBe("焼肉En");
    expect(await repo.getVenue("dining", "nope")).toBeUndefined();
  });

  it("拠点のデフォルト値が適用される (sns={}, gallery=[])", async () => {
    const venue = await repo.getVenue("dining", "en");
    expect(venue?.sns).toEqual({});
    expect(venue?.gallery).toEqual([]);
  });

  it("スキーマ違反のファイルはファイル名付きで例外になる", async () => {
    const dir = makeTempDir();
    mkdirSync(path.join(dir, "businesses"));
    writeFileSync(path.join(dir, "businesses", "bad.json"), JSON.stringify({ slug: "bad" }));
    await expect(createContentRepo(dir).getBusinesses()).rejects.toThrow(/bad\.json/);
  });

  it("スキーマ違反のエラーメッセージは prettifyError 形式になる", async () => {
    const dir = makeTempDir();
    mkdirSync(path.join(dir, "businesses"));
    writeFileSync(path.join(dir, "businesses", "bad.json"), JSON.stringify({ slug: "bad" }));
    await expect(createContentRepo(dir).getBusinesses()).rejects.toThrow(/✖/);
  });

  it("壊れた JSON はファイル名付きで例外になる", async () => {
    const dir = makeTempDir();
    mkdirSync(path.join(dir, "businesses"));
    writeFileSync(path.join(dir, "businesses", "broken.json"), "{ not valid json");
    await expect(createContentRepo(dir).getBusinesses()).rejects.toThrow(/broken\.json/);
  });

  it("frontmatter の business がディレクトリと一致しない場合は例外になる", async () => {
    const dir = makeTempDir();
    mkdirSync(path.join(dir, "venues", "dining"), { recursive: true });
    writeFileSync(
      path.join(dir, "venues", "dining", "mismatch.mdx"),
      `---\nslug: mismatch\nbusiness: nightlife\nkind: store\nname: テスト\ncategory: テスト\ncatchcopy: テスト\norder: 1\n---\n本文`,
    );
    await expect(createContentRepo(dir).getVenues("dining")).rejects.toThrow(/mismatch\.mdx/);
  });

  it("frontmatter の slug がファイル名と一致しない場合は例外になる", async () => {
    const dir = makeTempDir();
    mkdirSync(path.join(dir, "venues", "dining"), { recursive: true });
    writeFileSync(
      path.join(dir, "venues", "dining", "wrongslug.mdx"),
      `---\nslug: other\nbusiness: dining\nkind: store\nname: テスト\ncategory: テスト\ncatchcopy: テスト\norder: 1\n---\n本文`,
    );
    await expect(createContentRepo(dir).getVenues("dining")).rejects.toThrow(/wrongslug\.mdx/);
  });

  it("会社情報を取得でき、greeting.draft の既定値は false", async () => {
    const company = await repo.getCompany();
    expect(company.name).toBe("テスト株式会社");
    expect(company.businessSummary).toEqual(["事業A", "事業B"]);
    expect(company.greeting?.draft).toBe(false);
  });

  it("company.json のスキーマ違反はファイル名付きで例外になる", async () => {
    const dir = makeTempDir();
    writeFileSync(path.join(dir, "company.json"), JSON.stringify({ name: "A" }));
    await expect(createContentRepo(dir).getCompany()).rejects.toThrow(/company\.json/);
  });

  it("壊れた company.json はファイル名付きで例外になる", async () => {
    const dir = makeTempDir();
    writeFileSync(path.join(dir, "company.json"), "{ nope");
    await expect(createContentRepo(dir).getCompany()).rejects.toThrow(/company\.json/);
  });

  it("company.json が無い場合もファイル名付きで例外になる", async () => {
    const dir = makeTempDir();
    await expect(createContentRepo(dir).getCompany()).rejects.toThrow(/company\.json/);
  });
});
