import { describe, it, expect } from "vitest";
import { paragraphs } from "@/lib/page/text";

describe("paragraphs", () => {
  it("空行で段落に分け、空の段落を除く", () => {
    expect(paragraphs("一段落目\n\n二段落目\n \n\n三段落目\n")).toEqual(["一段落目", "二段落目", "三段落目"]);
  });

  it("段落内の改行は日本語ならそのまま連結する", () => {
    expect(paragraphs("温もりのある\n  空間で、\nゆったりと。")).toEqual(["温もりのある空間で、ゆったりと。"]);
  });

  it("英単語どうしの改行は空白でつなぐ", () => {
    expect(paragraphs("Open\nlate\nKINGYOで\n乾杯")).toEqual(["Open late KINGYOで乾杯"]);
  });

  it("CRLF と空文字列を扱う", () => {
    expect(paragraphs("一\r\n二\r\n\r\n三")).toEqual(["一二", "三"]);
    expect(paragraphs("")).toEqual([]);
    expect(paragraphs("\n \n")).toEqual([]);
  });
});
