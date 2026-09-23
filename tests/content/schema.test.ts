import { describe, it, expect } from "vitest";
import {
  BusinessSchema,
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
