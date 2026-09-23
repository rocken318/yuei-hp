import { describe, it, expect, vi } from "vitest";
import {
  buildContactEmail,
  DEFAULT_CONTACT_FROM,
  isMailConfigured,
  RESEND_ENDPOINT,
  sendContactEmail,
} from "@/lib/contact/mail";
import type { ContactData } from "@/lib/contact/schema";
import { submitContact } from "@/lib/contact/submit";

const data: ContactData = {
  type: "signage",
  name: "山田 太郎",
  company: "株式会社テスト",
  email: "taro@example.com",
  tel: "022-123-4567",
  message: "遊栄ビジョンへの広告掲載について\n詳しく教えてください。",
  agree: true,
  website: "",
};

const ok = async () => new Response("{}", { status: 200 });

describe("isMailConfigured", () => {
  it("API キーと送信先の両方があるときだけ有効", () => {
    expect(isMailConfigured({})).toBe(false);
    expect(isMailConfigured({ RESEND_API_KEY: "re_x" })).toBe(false);
    expect(isMailConfigured({ CONTACT_TO: "info@example.com" })).toBe(false);
    expect(isMailConfigured({ RESEND_API_KEY: " ", CONTACT_TO: "info@example.com" })).toBe(false);
    expect(isMailConfigured({ RESEND_API_KEY: "re_x", CONTACT_TO: "info@example.com" })).toBe(true);
  });
});

describe("buildContactEmail", () => {
  it("件名・宛先・返信先・本文を組み立てる", () => {
    const p = buildContactEmail(data, { CONTACT_TO: "info@example.com" });
    expect(p.from).toBe(DEFAULT_CONTACT_FROM);
    expect(p.to).toEqual(["info@example.com"]);
    expect(p.reply_to).toBe("taro@example.com");
    expect(p.subject).toBe("【お問い合わせ】サイネージ広告 山田 太郎様");
    expect(p.text).toContain("種別: サイネージ広告");
    expect(p.text).toContain("会社名: 株式会社テスト");
    expect(p.text).toContain("電話番号: 022-123-4567");
    expect(p.text).toContain("遊栄ビジョンへの広告掲載について\n詳しく教えてください。");
  });

  it("CONTACT_FROM と複数の送信先、未入力の任意項目", () => {
    const p = buildContactEmail(
      { ...data, type: "other", company: "", tel: "" },
      { CONTACT_TO: "a@example.com, b@example.com", CONTACT_FROM: "Site <noreply@example.com>" },
    );
    expect(p.from).toBe("Site <noreply@example.com>");
    expect(p.to).toEqual(["a@example.com", "b@example.com"]);
    expect(p.subject).toBe("【お問い合わせ】取材・その他 山田 太郎様");
    expect(p.text).toContain("会社名: （未入力）");
    expect(p.text).toContain("電話番号: （未入力）");
  });

  it("件名に改行を持ち込ませない", () => {
    const p = buildContactEmail({ ...data, name: "山田\r\nBcc: x@example.com" }, { CONTACT_TO: "info@example.com" });
    expect(p.subject).not.toMatch(/[\r\n]/);
  });
});

describe("sendContactEmail", () => {
  it("Resend に Bearer 認証で POST する", async () => {
    const fetchImpl = vi.fn(ok);
    const payload = buildContactEmail(data, { CONTACT_TO: "info@example.com" });
    await expect(sendContactEmail(payload, "re_key", fetchImpl)).resolves.toBe(true);
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe(RESEND_ENDPOINT);
    expect(init.method).toBe("POST");
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer re_key");
    expect(JSON.parse(init.body as string)).toEqual(payload);
  });

  it("エラー応答や通信失敗は false（例外を投げない）", async () => {
    const payload = buildContactEmail(data, { CONTACT_TO: "info@example.com" });
    await expect(sendContactEmail(payload, "k", async () => new Response("", { status: 422 }))).resolves.toBe(false);
    await expect(
      sendContactEmail(payload, "k", async () => {
        throw new Error("network");
      }),
    ).resolves.toBe(false);
  });
});

describe("submitContact", () => {
  const values = { ...data };
  const env = { RESEND_API_KEY: "re_key", CONTACT_TO: "info@example.com" };

  it("ハニーポットが埋まっていたら送らずに成功を装う", async () => {
    const fetchImpl = vi.fn(ok);
    await expect(submitContact({ ...values, website: "spam" }, env, fetchImpl)).resolves.toEqual({ status: "success" });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("不正な入力は項目別のエラー", async () => {
    const r = await submitContact({ ...values, email: "x" }, env, vi.fn(ok));
    expect(r).toEqual({ status: "invalid", errors: { email: "メールアドレスの形式が正しくありません。" } });
  });

  it("未設定なら disabled（送信しない）", async () => {
    const fetchImpl = vi.fn(ok);
    await expect(submitContact(values, {}, fetchImpl)).resolves.toEqual({ status: "disabled" });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("送信結果に応じて success / error", async () => {
    await expect(submitContact(values, env, ok)).resolves.toEqual({ status: "success" });
    await expect(submitContact(values, env, async () => new Response("", { status: 500 }))).resolves.toEqual({
      status: "error",
    });
  });
});
