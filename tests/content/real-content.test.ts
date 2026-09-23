import { describe, it, expect } from "vitest";
import { content } from "@/lib/content";

describe("content/ の実データ", () => {
  it("4事業すべてが存在する", () => {
    expect(content.getBusinesses().map((b) => b.slug)).toEqual(["nightlife", "dining", "signage", "digital"]);
  });
  it("拠点数が設計どおり", () => {
    expect(content.getVenues("nightlife").map((v) => v.slug)).toEqual(["kingyo", "b-club", "c-girl"]);
    expect(content.getVenues("dining").map((v) => v.slug)).toEqual(["en", "danke"]);
    expect(content.getVenues("signage").map((v) => v.slug)).toEqual(["chimatsushima", "peace", "eiraku", "bansui"]);
  });
});
