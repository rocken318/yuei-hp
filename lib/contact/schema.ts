import { z } from "zod";

/** Inquiry types, in display order. `?type=` on /contact preselects one. */
export const contactTypes = ["signage", "web", "other"] as const;
export type ContactType = (typeof contactTypes)[number];

export const contactTypeLabels: Record<ContactType, string> = {
  signage: "サイネージ広告",
  web: "Web制作",
  other: "取材・その他",
};

export function isContactType(v: unknown): v is ContactType {
  return typeof v === "string" && (contactTypes as readonly string[]).includes(v);
}

/** `?type=` value (possibly repeated or missing) → a known type, or undefined. */
export function parseContactType(v: string | string[] | undefined): ContactType | undefined {
  const first = Array.isArray(v) ? v[0] : v;
  return isContactType(first) ? first : undefined;
}

export const contactLimits = { name: 50, company: 100, messageMin: 10, messageMax: 2000 } as const;

/** Shared by the form (client) and the Server Action. */
export const ContactSchema = z.object({
  type: z.enum(contactTypes, { error: "お問い合わせ種別を選択してください。" }),
  name: z
    .string()
    .trim()
    .min(1, "お名前を入力してください。")
    .max(contactLimits.name, `お名前は${contactLimits.name}文字以内で入力してください。`),
  company: z
    .string()
    .trim()
    .max(contactLimits.company, `会社名は${contactLimits.company}文字以内で入力してください。`)
    .default(""),
  email: z
    .string()
    .trim()
    .min(1, "メールアドレスを入力してください。")
    .pipe(z.email("メールアドレスの形式が正しくありません。")),
  tel: z
    .string()
    .trim()
    .regex(/^(?:[0-9]+(?:-[0-9]+)*)?$/, "電話番号は半角数字とハイフンで入力してください。")
    .max(20, "電話番号が長すぎます。")
    .default(""),
  message: z
    .string()
    .trim()
    .min(1, "お問い合わせ内容を入力してください。")
    .min(contactLimits.messageMin, `お問い合わせ内容は${contactLimits.messageMin}文字以上で入力してください。`)
    .max(contactLimits.messageMax, `お問い合わせ内容は${contactLimits.messageMax}文字以内で入力してください。`),
  agree: z.literal(true, { error: "プライバシーポリシーへの同意が必要です。" }),
  /** Honeypot: hidden from people, bots fill it. */
  website: z.string().max(0).default(""),
});

export type ContactInput = z.input<typeof ContactSchema>;
export type ContactData = z.output<typeof ContactSchema>;
export type ContactField = keyof ContactData;
export type ContactFieldErrors = Partial<Record<ContactField, string>>;

/** Raw form values as the form holds them (strings and a checkbox). */
export type ContactValues = {
  type: string;
  name: string;
  company: string;
  email: string;
  tel: string;
  message: string;
  agree: boolean;
  website: string;
};

export const emptyContactValues = (type?: ContactType): ContactValues => ({
  type: type ?? "",
  name: "",
  company: "",
  email: "",
  tel: "",
  message: "",
  agree: false,
  website: "",
});

/** FormData → raw values (missing fields become ""; the checkbox → boolean). */
export function contactValuesFromFormData(fd: FormData): ContactValues {
  const s = (k: string) => {
    const v = fd.get(k);
    return typeof v === "string" ? v : "";
  };
  return {
    type: s("type"),
    name: s("name"),
    company: s("company"),
    email: s("email"),
    tel: s("tel"),
    message: s("message"),
    agree: fd.get("agree") === "on" || fd.get("agree") === "true",
    website: s("website"),
  };
}

export type ContactParseResult =
  | { success: true; data: ContactData }
  | { success: false; errors: ContactFieldErrors };

/** Validates the whole form; errors are the first message per field. */
export function validateContact(values: ContactValues): ContactParseResult {
  const result = ContactSchema.safeParse({ ...values, type: values.type || undefined });
  if (result.success) return { success: true, data: result.data };
  const errors: ContactFieldErrors = {};
  for (const issue of result.error.issues) {
    const key = issue.path[0] as ContactField | undefined;
    if (key && !errors[key]) errors[key] = issue.message;
  }
  return { success: false, errors };
}

/** Validates one field (for inline feedback on blur/change). */
export function validateContactField(field: ContactField, values: ContactValues): string | undefined {
  const raw = field === "type" ? values.type || undefined : values[field];
  const result = ContactSchema.shape[field].safeParse(raw);
  return result.success ? undefined : result.error.issues[0]?.message;
}
