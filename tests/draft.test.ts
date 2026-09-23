import { describe, it, expect } from "vitest";
import { showDrafts } from "@/lib/draft";

describe("showDrafts", () => {
  it("本番（VERCEL_ENV=production）では false", () => {
    expect(showDrafts({ VERCEL_ENV: "production" })).toBe(false);
  });
  it("プレビューでは true", () => {
    expect(showDrafts({ VERCEL_ENV: "preview" })).toBe(true);
  });
  it("ローカル（VERCEL_ENV 未設定）では true", () => {
    expect(showDrafts({})).toBe(true);
  });
  it("引数なしなら process.env を見る", () => {
    expect(showDrafts()).toBe(process.env.VERCEL_ENV !== "production");
  });
});
