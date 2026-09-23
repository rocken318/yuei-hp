import { describe, it, expect } from "vitest";
import { adjacentNews, formatNewsDate } from "@/lib/page/news";

describe("formatNewsDate", () => {
  it("YYYY-MM-DD を YYYY.MM.DD で表示する", () => {
    expect(formatNewsDate("2026-09-24")).toBe("2026.09.24");
  });
});

describe("adjacentNews", () => {
  // Newest first, as ContentRepo.getNews() returns them.
  const items = [{ slug: "c" }, { slug: "b" }, { slug: "a" }];

  it("中間の記事は前（新しい）と次（古い）の両方がある", () => {
    expect(adjacentNews(items, "b")).toEqual({ newer: { slug: "c" }, older: { slug: "a" } });
  });

  it("最新の記事に新しい側は無く、最古の記事に古い側は無い", () => {
    expect(adjacentNews(items, "c")).toEqual({ newer: undefined, older: { slug: "b" } });
    expect(adjacentNews(items, "a")).toEqual({ newer: { slug: "b" }, older: undefined });
  });

  it("1件だけ／見つからない場合はどちらも無い", () => {
    expect(adjacentNews([{ slug: "x" }], "x")).toEqual({ newer: undefined, older: undefined });
    expect(adjacentNews(items, "nope")).toEqual({ newer: undefined, older: undefined });
  });
});
