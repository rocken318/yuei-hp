import { describe, it, expect } from "vitest";
import {
  contactTypeLabels,
  contactValuesFromFormData,
  emptyContactValues,
  parseContactType,
  validateContact,
  validateContactField,
  type ContactValues,
} from "@/lib/contact/schema";

const valid: ContactValues = {
  type: "web",
  name: "山田 太郎",
  company: "",
  email: "taro@example.com",
  tel: "",
  message: "Webサイトの制作について相談したいです。",
  agree: true,
  website: "",
};

describe("parseContactType", () => {
  it("既知の種別だけを受け付ける", () => {
    expect(parseContactType("signage")).toBe("signage");
    expect(parseContactType(["web", "other"])).toBe("web");
    expect(parseContactType("recruit")).toBeUndefined();
    expect(parseContactType(undefined)).toBeUndefined();
  });

  it("種別ラベル", () => {
    expect(contactTypeLabels).toEqual({ signage: "サイネージ広告", web: "Web制作", other: "取材・その他" });
  });
});

describe("validateContact", () => {
  it("正しい入力を通し、前後の空白を取り除く", () => {
    const r = validateContact({ ...valid, name: "  山田 太郎 ", tel: "022-123-4567", company: "株式会社テスト" });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.name).toBe("山田 太郎");
      expect(r.data.tel).toBe("022-123-4567");
    }
  });

  it("空のフォームは必須項目すべてにエラーを出す", () => {
    const r = validateContact(emptyContactValues());
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(Object.keys(r.errors).sort()).toEqual(["agree", "email", "message", "name", "type"]);
      expect(r.errors.name).toBe("お名前を入力してください。");
      expect(r.errors.email).toBe("メールアドレスを入力してください。");
      expect(r.errors.message).toBe("お問い合わせ内容を入力してください。");
      expect(r.errors.agree).toBe("プライバシーポリシーへの同意が必要です。");
      expect(r.errors.type).toBe("お問い合わせ種別を選択してください。");
    }
  });

  it("文字数の上限・下限", () => {
    const tooLong = validateContact({ ...valid, name: "あ".repeat(51), company: "い".repeat(101), message: "う".repeat(2001) });
    expect(tooLong.success).toBe(false);
    if (!tooLong.success) expect(Object.keys(tooLong.errors).sort()).toEqual(["company", "message", "name"]);
    expect(validateContact({ ...valid, name: "あ".repeat(50), company: "い".repeat(100), message: "う".repeat(2000) }).success).toBe(true);

    const short = validateContact({ ...valid, message: "短い文章です" });
    expect(short.success).toBe(false);
    if (!short.success) expect(short.errors.message).toBe("お問い合わせ内容は10文字以上で入力してください。");
  });

  it("メールと電話番号の形式", () => {
    const r = validateContact({ ...valid, email: "not-an-email", tel: "022(123)4567" });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.errors.email).toBe("メールアドレスの形式が正しくありません。");
      expect(r.errors.tel).toBe("電話番号は半角数字とハイフンで入力してください。");
    }
    expect(validateContact({ ...valid, tel: "09012345678" }).success).toBe(true);
    expect(validateContact({ ...valid, tel: "-090" }).success).toBe(false);
  });

  it("未知の種別・同意なし・ハニーポット入力は不正", () => {
    expect(validateContact({ ...valid, type: "recruit" }).success).toBe(false);
    expect(validateContact({ ...valid, agree: false }).success).toBe(false);
    expect(validateContact({ ...valid, website: "http://spam.example" }).success).toBe(false);
  });
});

describe("validateContactField", () => {
  it("1項目だけを検証する", () => {
    expect(validateContactField("name", emptyContactValues())).toBe("お名前を入力してください。");
    expect(validateContactField("name", valid)).toBeUndefined();
    expect(validateContactField("company", emptyContactValues())).toBeUndefined();
    expect(validateContactField("type", emptyContactValues())).toBe("お問い合わせ種別を選択してください。");
    expect(validateContactField("type", emptyContactValues("other"))).toBeUndefined();
  });
});

describe("contactValuesFromFormData", () => {
  it("FormData を文字列値とチェックボックスの真偽に変換する", () => {
    const fd = new FormData();
    fd.set("type", "signage");
    fd.set("name", "山田");
    fd.set("agree", "on");
    const v = contactValuesFromFormData(fd);
    expect(v).toEqual({ ...emptyContactValues("signage"), name: "山田", agree: true });
    expect(contactValuesFromFormData(new FormData()).agree).toBe(false);
  });
});
