import { describe, it, expect } from "vitest";
import { createElement } from "react";
import { hasInfoValue, visibleInfoRows } from "@/lib/page/info-rows";

describe("hasInfoValue", () => {
  it("空の値を「値なし」とみなす", () => {
    for (const v of [undefined, null, false, true, "", "   ", "\n", [], ["", null]]) {
      expect(hasInfoValue(v)).toBe(false);
    }
  });

  it("文字列・数値（0 を含む）・要素・中身のある配列は表示する", () => {
    expect(hasInfoValue("仙台市青葉区")).toBe(true);
    expect(hasInfoValue(0)).toBe(true);
    expect(hasInfoValue(createElement("a", { href: "#" }, "リンク"))).toBe(true);
    expect(hasInfoValue(["", "月〜土"])).toBe(true);
  });
});

describe("visibleInfoRows", () => {
  it("値のある行だけを順序どおり返す", () => {
    const rows = [
      { label: "住所", value: "宮城県仙台市" },
      { label: "電話番号" },
      { label: "営業時間", value: " " },
      { label: "定休日", value: "日曜" },
    ];
    expect(visibleInfoRows(rows).map((r) => r.label)).toEqual(["住所", "定休日"]);
  });

  it("すべて空なら空配列", () => {
    expect(visibleInfoRows([{ label: "住所" }, { label: "TEL", value: "" }])).toEqual([]);
  });
});
