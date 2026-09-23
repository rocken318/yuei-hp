import { describe, it, expect } from "vitest";
import { venueBusinessSlugs, isVenueBusiness, type VenueBusinessSlug } from "@/lib/content/schema";

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
