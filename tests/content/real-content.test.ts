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
  it("拠点の gallery の画像がすべて public/ に実在し、重複しない", async () => {
    for (const business of ["nightlife", "dining", "signage"] as const) {
      for (const v of await content.getVenues(business)) {
        expect(new Set(v.gallery).size, `${business}/${v.slug}`).toBe(v.gallery.length);
        for (const img of v.gallery) {
          expect(img, `${business}/${v.slug}`).toMatch(/^\/images\/.+\.webp$/);
          expect(existsSync(path.join(process.cwd(), "public", img)), img).toBe(true);
        }
      }
    }
  });
  it("写真がある店舗には heroImage と gallery がある", async () => {
    const stores = [
      ...(await content.getVenues("nightlife")),
      ...(await content.getVenues("dining")),
    ];
    for (const v of stores) {
      expect(v.heroImage, v.slug).toBeDefined();
      expect(v.gallery.length, v.slug).toBeGreaterThan(0);
    }
  });
  it("会社情報: 名称・4事業・企業理念があり、代表挨拶は下書き", async () => {
    const company = await content.getCompany();
    expect(company.name).toBe("遊栄JAPAN株式会社");
    expect(company.nameEn).toBe("YUEI JAPAN Inc.");
    const businesses = await content.getBusinesses();
    expect(company.businessSummary).toEqual(businesses.map((b) => b.name));
    expect(company.philosophy?.title).toBe("国分町の夜から、街の未来へ。");
    expect(company.greeting?.draft).toBe(true);
  });
  it("全事業に lead と description がある", async () => {
    for (const b of await content.getBusinesses()) {
      expect(b.lead, b.slug).toBeTruthy();
      expect(b.description?.length ?? 0, b.slug).toBeGreaterThanOrEqual(2);
    }
  });
  it("digital にはサービス4件と制作フロー5ステップがある", async () => {
    const digital = await content.getBusiness("digital");
    expect(digital?.services?.map((s) => s.title)).toEqual([
      "Webサイト制作",
      "Webシステム開発",
      "映像・サイネージコンテンツ制作",
      "運用・改善サポート",
    ]);
    expect(digital?.flow?.map((f) => f.title)).toEqual([
      "ヒアリング",
      "ご提案・お見積り",
      "設計・デザイン",
      "開発・制作",
      "公開・運用",
    ]);
  });
});
