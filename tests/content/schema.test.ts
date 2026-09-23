import { describe, it, expect } from "vitest";
import {
  BusinessSchema,
  NewsFrontmatterSchema,
  newsCategories,
  CompanySchema,
  venueBusinessSlugs,
  isVenueBusiness,
  type VenueBusinessSlug,
} from "@/lib/content/schema";

describe("venueBusinessSlugs / isVenueBusiness", () => {
  it("nightlife, dining, signage を含む", () => {
    expect(venueBusinessSlugs).toEqual(["nightlife", "dining", "signage"]);
  });

  it("有効な business slug を判定できる", () => {
    expect(isVenueBusiness("dining")).toBe(true);
    expect(isVenueBusiness("nightlife")).toBe(true);
    expect(isVenueBusiness("signage")).toBe(true);
  });

  it("無効な business slug を判定できる", () => {
    expect(isVenueBusiness("digital")).toBe(false);
    expect(isVenueBusiness("nope")).toBe(false);
  });

  it("型ガードとして絞り込める", () => {
    const value: string = "dining";
    if (isVenueBusiness(value)) {
      const narrowed: VenueBusinessSlug = value;
      expect(narrowed).toBe("dining");
    } else {
      throw new Error("expected narrowing to succeed");
    }
  });
});

describe("CompanySchema", () => {
  it("name / nameEn だけで有効", () => {
    const c = CompanySchema.parse({ name: "A", nameEn: "B" });
    expect(c.name).toBe("A");
    expect(c.greeting).toBeUndefined();
  });

  it("name / nameEn が無いと無効", () => {
    expect(CompanySchema.safeParse({ name: "A" }).success).toBe(false);
    expect(CompanySchema.safeParse({ nameEn: "B" }).success).toBe(false);
  });

  it("greeting.draft の既定値は false", () => {
    const c = CompanySchema.parse({ name: "A", nameEn: "B", greeting: { title: "t", body: "b" } });
    expect(c.greeting?.draft).toBe(false);
  });

  it("任意項目をすべて受け付ける", () => {
    const c = CompanySchema.parse({
      name: "A",
      nameEn: "B",
      representative: "代表",
      established: "設立",
      capital: "資本金",
      address: "住所",
      tel: "000",
      employees: "10名",
      businessSummary: ["x"],
      history: [{ date: "2020", text: "創業" }],
      philosophy: { title: "t", body: "b" },
      greeting: { title: "t", body: "b", signature: "s", draft: true },
    });
    expect(c.history).toEqual([{ date: "2020", text: "創業" }]);
    expect(c.greeting?.draft).toBe(true);
  });
});

describe("BusinessSchema の追加フィールド", () => {
  const base = { slug: "digital", name: "n", nameEn: "e", summary: "s", order: 1 };

  it("追加フィールドは任意", () => {
    const b = BusinessSchema.parse(base);
    expect(b.lead).toBeUndefined();
    expect(b.description).toBeUndefined();
    expect(b.services).toBeUndefined();
    expect(b.flow).toBeUndefined();
  });

  it("lead / description / services / flow を受け付ける", () => {
    const b = BusinessSchema.parse({
      ...base,
      lead: "リード",
      description: ["段落1", "段落2"],
      services: [{ title: "サービス", body: "説明" }],
      flow: [{ step: "01", title: "ヒアリング", body: "説明" }, { title: "公開", body: "説明" }],
    });
    expect(b.description).toHaveLength(2);
    expect(b.services?.[0].title).toBe("サービス");
    expect(b.flow?.[1].step).toBeUndefined();
  });

  it("services の要素に body が無いと無効", () => {
    expect(BusinessSchema.safeParse({ ...base, services: [{ title: "x" }] }).success).toBe(false);
  });
});

describe("titleDisplay", () => {
  const business = { slug: "nightlife", name: "ナイト事業", nameEn: "e", summary: "s", order: 1 };

  it("| を除いて表示名と一致すれば有効", () => {
    expect(BusinessSchema.safeParse({ ...business, titleDisplay: "ナイト|事業" }).success).toBe(true);
    expect(
      BusinessSchema.safeParse({ ...business, brand: "遊栄ビジョン", titleDisplay: "遊栄|ビジョン" }).success,
    ).toBe(true);
  });

  it("表示名と一致しなければ無効", () => {
    expect(BusinessSchema.safeParse({ ...business, titleDisplay: "ナイト|事業部" }).success).toBe(false);
    expect(BusinessSchema.safeParse({ ...business, brand: "遊栄ビジョン", titleDisplay: "ナイト|事業" }).success).toBe(
      false,
    );
  });
});

describe("CompanySchema の登記情報", () => {
  it("nameKana / corporateNumber は任意", () => {
    const c = CompanySchema.parse({ name: "A", nameEn: "B" });
    expect(c.nameKana).toBeUndefined();
    expect(c.corporateNumber).toBeUndefined();
  });

  it("nameKana / corporateNumber を受け付ける", () => {
    const c = CompanySchema.parse({ name: "A", nameEn: "B", nameKana: "エー", corporateNumber: "4370001019890" });
    expect(c.nameKana).toBe("エー");
    expect(c.corporateNumber).toBe("4370001019890");
  });

  it("法人番号は13桁の数字のみ", () => {
    expect(CompanySchema.safeParse({ name: "A", nameEn: "B", corporateNumber: "123" }).success).toBe(false);
    expect(CompanySchema.safeParse({ name: "A", nameEn: "B", corporateNumber: "437000101989X" }).success).toBe(false);
  });
});

describe("NewsFrontmatterSchema", () => {
  const base = { title: "タイトル", date: "2026-09-24", category: "お知らせ" };

  it("title / date / category で有効、excerpt は任意", () => {
    const n = NewsFrontmatterSchema.parse(base);
    expect(n).toEqual({ title: "タイトル", date: "2026-09-24", category: "お知らせ" });
  });

  it("excerpt を受け付ける", () => {
    expect(NewsFrontmatterSchema.parse({ ...base, excerpt: "概要" }).excerpt).toBe("概要");
  });

  it("category は お知らせ|店舗|採用|メディア のみ", () => {
    for (const category of newsCategories) {
      expect(NewsFrontmatterSchema.safeParse({ ...base, category }).success).toBe(true);
    }
    expect(NewsFrontmatterSchema.safeParse({ ...base, category: "その他" }).success).toBe(false);
  });

  it("date は YYYY-MM-DD 文字列（YAML が Date にした値も YYYY-MM-DD に戻す）", () => {
    expect(NewsFrontmatterSchema.parse({ ...base, date: new Date("2026-01-05T00:00:00Z") }).date).toBe("2026-01-05");
    expect(NewsFrontmatterSchema.safeParse({ ...base, date: "2026/09/24" }).success).toBe(false);
    expect(NewsFrontmatterSchema.safeParse({ ...base, date: "2026-9-24" }).success).toBe(false);
    expect(NewsFrontmatterSchema.safeParse({ ...base, date: "2026-02-30" }).success).toBe(false);
  });

  it("title が無いと無効", () => {
    expect(NewsFrontmatterSchema.safeParse({ date: "2026-09-24", category: "お知らせ" }).success).toBe(false);
  });
});
