import { describe, it, expect } from "vitest";
import { DEFAULT_OG_IMAGE, pageMetadata } from "@/lib/seo/metadata";
import { absoluteUrl } from "@/lib/site";

describe("pageMetadata", () => {
  it("canonical と og:url にページのパス、共通の og 項目と共有画像を入れる", () => {
    expect(pageMetadata({ title: "会社概要", description: "説明", path: "/about" })).toEqual({
      title: "会社概要",
      description: "説明",
      alternates: { canonical: "/about" },
      openGraph: { siteName: "遊栄JAPAN", locale: "ja_JP", type: "website", url: "/about", images: [DEFAULT_OG_IMAGE] },
    });
  });

  it("title/description を省略するとキーを出さない（親の値を継承）", () => {
    const m = pageMetadata({ path: "/" });
    expect(m).not.toHaveProperty("title");
    expect(m).not.toHaveProperty("description");
  });
});

describe("absoluteUrl", () => {
  it("ベースURLとパスを結合する", () => {
    expect(absoluteUrl("/about", "https://example.com")).toBe("https://example.com/about");
    expect(absoluteUrl("/", "https://example.com")).toBe("https://example.com/");
  });
});
