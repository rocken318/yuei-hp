import { describe, it, expect } from "vitest";
import {
  breadcrumbJsonLd,
  localBusinessJsonLd,
  organizationJsonLd,
  parseJapaneseAddress,
  serializeJsonLd,
} from "@/lib/seo/json-ld";

const BASE = "https://example.com";

describe("serializeJsonLd", () => {
  it("< をエスケープして script 要素を閉じられないようにする", () => {
    const out = serializeJsonLd({ "@type": "Thing", name: "</script><script>alert(1)</script>" });
    expect(out).not.toContain("<");
    expect(JSON.parse(out).name).toBe("</script><script>alert(1)</script>");
  });
});

describe("parseJapaneseAddress", () => {
  it("政令市の区まで addressLocality にする", () => {
    expect(parseJapaneseAddress("宮城県仙台市青葉区国分町2丁目8番30号 NJビル5階")).toEqual({
      "@type": "PostalAddress",
      addressCountry: "JP",
      addressRegion: "宮城県",
      addressLocality: "仙台市青葉区",
      streetAddress: "国分町2丁目8番30号 NJビル5階",
    });
  });

  it("区の無い市・郡・東京23区も分ける", () => {
    expect(parseJapaneseAddress("宮城県塩竈市海岸通1-1")).toMatchObject({ addressRegion: "宮城県", addressLocality: "塩竈市", streetAddress: "海岸通1-1" });
    expect(parseJapaneseAddress("宮城県宮城郡松島町松島字町内1")).toMatchObject({ addressLocality: "宮城郡松島町", streetAddress: "松島字町内1" });
    expect(parseJapaneseAddress("東京都渋谷区道玄坂1-2-3")).toMatchObject({ addressRegion: "東京都", addressLocality: "渋谷区", streetAddress: "道玄坂1-2-3" });
  });

  it("都道府県で始まらない住所は undefined", () => {
    expect(parseJapaneseAddress("国分町2丁目8番30号")).toBeUndefined();
  });
});

describe("organizationJsonLd", () => {
  const company = {
    name: "遊栄Japan株式会社",
    nameEn: "YUEI JAPAN Inc.",
    nameKana: "ユウエイジャパン",
    corporateNumber: "4370001019890",
    address: "宮城県仙台市青葉区国分町2丁目8番30号 NJビル5階",
  };

  it("社名・別名・URL・ロゴ・住所・法人番号を持つ", () => {
    const org = organizationJsonLd(company, BASE);
    expect(org).toEqual({
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "遊栄Japan株式会社",
      alternateName: ["YUEI JAPAN Inc.", "ユウエイジャパン"],
      url: "https://example.com/",
      logo: "https://example.com/brand/yuei-logo.svg",
      address: {
        "@type": "PostalAddress",
        addressCountry: "JP",
        addressRegion: "宮城県",
        addressLocality: "仙台市青葉区",
        streetAddress: "国分町2丁目8番30号 NJビル5階",
      },
      identifier: { "@type": "PropertyValue", propertyID: "法人番号", value: "4370001019890" },
    });
    expect(org).not.toHaveProperty("address.postalCode");
  });

  it("不明な項目は出さない", () => {
    const org = organizationJsonLd({ name: "X" }, BASE);
    expect(org).not.toHaveProperty("alternateName");
    expect(org).not.toHaveProperty("address");
    expect(org).not.toHaveProperty("identifier");
  });
});

describe("breadcrumbJsonLd", () => {
  it("表示中のパンくずから ListItem を作り、最後の項目に現在のURLを入れる", () => {
    const ld = breadcrumbJsonLd(
      [{ href: "/", label: "ホーム" }, { href: "/business", label: "事業紹介" }, { label: "金魚" }],
      "/business/nightlife/kingyo",
      BASE,
    );
    expect(ld).toEqual({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "ホーム", item: "https://example.com/" },
        { "@type": "ListItem", position: 2, name: "事業紹介", item: "https://example.com/business" },
        { "@type": "ListItem", position: 3, name: "金魚", item: "https://example.com/business/nightlife/kingyo" },
      ],
    });
  });
});

describe("localBusinessJsonLd", () => {
  const store = { business: "dining", kind: "store" as const, name: "焼肉En" };

  it("住所が無い店舗は出さない", () => {
    expect(localBusinessJsonLd(store, "/business/dining/en", BASE)).toBeUndefined();
  });

  it("サイネージ拠点は住所があっても出さない", () => {
    expect(
      localBusinessJsonLd({ ...store, kind: "signage", address: "宮城県仙台市青葉区国分町1-1" }, "/x", BASE),
    ).toBeUndefined();
  });

  it("住所がある店舗は LocalBusiness（飲食は Restaurant）を作る", () => {
    const ld = localBusinessJsonLd(
      {
        ...store,
        address: "宮城県仙台市青葉区国分町1-1",
        tel: "022-000-0000",
        heroImage: "/images/en.webp",
        siteUrl: "https://en.example.com",
        sns: { instagram: "https://instagram.com/en", x: undefined },
      },
      "/business/dining/en",
      BASE,
    );
    expect(ld).toMatchObject({
      "@type": "Restaurant",
      name: "焼肉En",
      url: "https://example.com/business/dining/en",
      address: { addressLocality: "仙台市青葉区", streetAddress: "国分町1-1" },
      telephone: "022-000-0000",
      image: "https://example.com/images/en.webp",
      sameAs: ["https://en.example.com", "https://instagram.com/en"],
    });
    expect(localBusinessJsonLd({ ...store, business: "nightlife", address: "宮城県仙台市青葉区国分町1-1" }, "/x", BASE)?.["@type"]).toBe(
      "LocalBusiness",
    );
  });
});
