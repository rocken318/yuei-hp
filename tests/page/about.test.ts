import { describe, it, expect } from "vitest";
import {
  businessSummaryItems,
  aboutSections,
  googleMapsUrl,
  philosophyBody,
  shouldShowGreeting,
} from "@/lib/page/about";

describe("philosophyBody", () => {
  it("本文の1行目が見出しと同じなら除く", () => {
    expect(philosophyBody({ title: "見出し。", body: "見出し。\n一行目\n二行目" })).toBe("一行目\n二行目");
  });

  it("見出しと違う1行目は残し、空行を除く", () => {
    expect(philosophyBody({ title: "見出し", body: "別の行\n\n  次の行 \n" })).toBe("別の行\n次の行");
  });
});

describe("shouldShowGreeting", () => {
  it("確定稿は常に表示、下書きは下書き表示時のみ、未設定は表示しない", () => {
    expect(shouldShowGreeting({ draft: false }, false)).toBe(true);
    expect(shouldShowGreeting({ draft: true }, true)).toBe(true);
    expect(shouldShowGreeting({ draft: true }, false)).toBe(false);
    expect(shouldShowGreeting(undefined, true)).toBe(false);
  });
});

describe("businessSummaryItems", () => {
  const businesses = [
    { slug: "dining", name: "飲食事業" },
    { slug: "signage", name: "デジタルサイネージ事業" },
  ];

  it("事業名が一致すれば /business/<slug> へのリンクにする", () => {
    expect(businessSummaryItems(["飲食事業", "不動産事業"], businesses)).toEqual([
      { label: "飲食事業", href: "/business/dining" },
      { label: "不動産事業" },
    ]);
  });

  it("未設定なら空配列", () => {
    expect(businessSummaryItems(undefined, businesses)).toEqual([]);
  });
});

describe("googleMapsUrl", () => {
  it("住所をエンコードした検索リンクを返す", () => {
    expect(googleMapsUrl(" 仙台市青葉区国分町2-1-1 ")).toBe(
      "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent("仙台市青葉区国分町2-1-1"),
    );
  });
});

describe("aboutSections", () => {
  const company = {
    philosophy: { title: "理念", body: "本文" },
    greeting: { title: "ごあいさつ", body: "本文", draft: true },
    history: [{ date: "2020年", text: "設立" }],
    address: "仙台市青葉区国分町",
  };

  it("本番（VERCEL_ENV=production）では下書きの代表挨拶を出さない", () => {
    expect(aboutSections(company, { VERCEL_ENV: "production" })).toEqual([
      "philosophy",
      "profile",
      "history",
      "access",
      "cta",
    ]);
  });

  it("プレビュー・ローカルでは下書きも出す", () => {
    expect(aboutSections(company, { VERCEL_ENV: "preview" })).toContain("greeting");
    expect(aboutSections(company, {})).toContain("greeting");
  });

  it("確定稿の代表挨拶は本番でも出す", () => {
    expect(
      aboutSections({ ...company, greeting: { ...company.greeting, draft: false } }, { VERCEL_ENV: "production" }),
    ).toContain("greeting");
  });

  it("未設定の任意項目のセクションは出さない", () => {
    expect(aboutSections({}, {})).toEqual(["profile", "cta"]);
  });
});
