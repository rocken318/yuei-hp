import { describe, it, expect } from "vitest";
import { titleParts } from "@/components/sections/business/title-parts";

describe("titleParts", () => {
  it("titleDisplay の | で分割する", () => {
    expect(titleParts("ナイトエンターテインメント事業", "ナイト|エンターテインメント|事業")).toEqual([
      "ナイト",
      "エンターテインメント",
      "事業",
    ]);
    expect(titleParts("ダイニングバー暖家", "ダイニングバー|暖家")).toEqual(["ダイニングバー", "暖家"]);
  });

  it("空の区切り（|| や端の |）は無視する", () => {
    expect(titleParts("AB", "|A||B|")).toEqual(["A", "B"]);
  });

  it("titleDisplay が title と一致しなければ既定の規則に戻る", () => {
    expect(titleParts("飲食事業", "別の|名前")).toEqual(["飲食", "事業"]);
  });

  it("既定: ・の後で分ける", () => {
    expect(titleParts("Web開発・コンテンツ制作事業")).toEqual(["Web開発・", "コンテンツ制作事業"]);
  });

  it("既定: ・がなければ末尾の「事業」の前で分ける", () => {
    expect(titleParts("デジタルサイネージ事業")).toEqual(["デジタルサイネージ", "事業"]);
  });

  it("既定: 区切りがなければ全体を1つにする", () => {
    expect(titleParts("遊栄ビジョン")).toEqual(["遊栄ビジョン"]);
    expect(titleParts("KINGYO")).toEqual(["KINGYO"]);
  });
});
