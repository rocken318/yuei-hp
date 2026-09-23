import { describe, it, expect } from "vitest";
import { buildSitemapEntries, STATIC_ROUTES } from "@/lib/seo/sitemap";

const input = {
  baseUrl: "https://example.com",
  businesses: ["nightlife", "digital"],
  venues: [{ business: "nightlife", slug: "kingyo" }],
  news: [
    { slug: "b", date: "2026-09-24" },
    { slug: "a", date: "2026-01-10" },
  ],
};

describe("buildSitemapEntries", () => {
  const entries = buildSitemapEntries(input);
  const urls = entries.map((e) => e.url);

  it("固定ページ・事業・店舗・お知らせの全URLを絶対URLで並べる", () => {
    expect(urls).toEqual([
      ...STATIC_ROUTES.map((p) => new URL(p, "https://example.com/").toString()),
      "https://example.com/business/nightlife",
      "https://example.com/business/digital",
      "https://example.com/business/nightlife/kingyo",
      "https://example.com/news/b",
      "https://example.com/news/a",
    ]);
    expect(urls[0]).toBe("https://example.com/");
    expect(new Set(urls).size).toBe(urls.length);
  });

  it("記事は公開日、トップと /news は最新記事の日付を lastModified にする", () => {
    const at = (u: string) => entries.find((e) => e.url === u)?.lastModified;
    expect(at("https://example.com/news/a")).toBe("2026-01-10");
    expect(at("https://example.com/news")).toBe("2026-09-24");
    expect(at("https://example.com/")).toBe("2026-09-24");
    expect(at("https://example.com/about")).toBeUndefined();
    expect(at("https://example.com/business/nightlife/kingyo")).toBeUndefined();
  });

  it("お知らせが無ければ lastModified を付けない", () => {
    const none = buildSitemapEntries({ ...input, news: [] });
    expect(none.every((e) => e.lastModified === undefined)).toBe(true);
  });
});
