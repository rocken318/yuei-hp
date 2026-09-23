import { contactTypeLabels, type ContactData } from "./schema";

/** The env vars the contact mail needs (a subset of process.env). */
export type MailEnv = {
  RESEND_API_KEY?: string;
  CONTACT_TO?: string;
  CONTACT_FROM?: string;
};

export const RESEND_ENDPOINT = "https://api.resend.com/emails";
export const DEFAULT_CONTACT_FROM = "onboarding@resend.dev";

const present = (v: string | undefined) => typeof v === "string" && v.trim() !== "";

/**
 * Sending is on only when the API key, the recipient AND the sender are all
 * set. CONTACT_FROM is required because Resend's shared sender
 * (onboarding@resend.dev) only delivers to the Resend account owner, so
 * without a verified-domain sender inquiries would silently go nowhere.
 */
export function isMailConfigured(env: MailEnv): boolean {
  return present(env.RESEND_API_KEY) && present(env.CONTACT_TO) && present(env.CONTACT_FROM);
}

/** Resend request timeout: a hung request fails the submission instead of stalling it. */
export const RESEND_TIMEOUT_MS = 10_000;

export type ContactEmailPayload = {
  from: string;
  to: string[];
  reply_to: string;
  subject: string;
  text: string;
};

/** Recipients: CONTACT_TO may list several addresses separated by commas. */
const splitAddresses = (v: string) =>
  v
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

/** Line breaks would let a value add mail headers; keep one-liners flat. */
const oneLine = (s: string) => s.replace(/[\r\n]+/g, " ").trim();

/** The Resend "send email" body for a validated inquiry. */
export function buildContactEmail(data: ContactData, env: Required<Pick<MailEnv, "CONTACT_TO">> & MailEnv): ContactEmailPayload {
  const label = contactTypeLabels[data.type];
  const name = oneLine(data.name);
  const text = [
    "コーポレートサイトのお問い合わせフォームから送信がありました。",
    "",
    `種別: ${label}`,
    `お名前: ${name}`,
    `会社名: ${oneLine(data.company) || "（未入力）"}`,
    `メールアドレス: ${oneLine(data.email)}`,
    `電話番号: ${oneLine(data.tel) || "（未入力）"}`,
    "",
    "お問い合わせ内容:",
    data.message,
  ].join("\n");
  return {
    from: present(env.CONTACT_FROM) ? env.CONTACT_FROM!.trim() : DEFAULT_CONTACT_FROM,
    to: splitAddresses(env.CONTACT_TO),
    reply_to: oneLine(data.email),
    subject: `【お問い合わせ】${label} ${name}様`,
    text,
  };
}

/**
 * Posts the payload to Resend. Resolves to true on a 2xx response, false on
 * any failure (network error, timeout or error status) — never throws.
 * Failures are logged with the status / Resend's error body only; the
 * payload (the inquirer's personal data) is never logged.
 */
export async function sendContactEmail(
  payload: ContactEmailPayload,
  apiKey: string,
  fetchImpl: typeof fetch = fetch,
): Promise<boolean> {
  try {
    const res = await fetchImpl(RESEND_ENDPOINT, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      cache: "no-store",
      signal: AbortSignal.timeout(RESEND_TIMEOUT_MS),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error(`contact mail: Resend responded ${res.status}: ${body.slice(0, 500)}`);
      return false;
    }
    return true;
  } catch (err) {
    const name = err instanceof Error ? err.name : "";
    if (name === "TimeoutError" || name === "AbortError") {
      console.error(`contact mail: Resend request timed out after ${RESEND_TIMEOUT_MS}ms`);
    } else {
      console.error(`contact mail: Resend request failed (${name || "unknown error"})`);
    }
    return false;
  }
}
