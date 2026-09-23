import { buildContactEmail, isMailConfigured, sendContactEmail, type MailEnv } from "./mail";
import { validateContact, type ContactValues } from "./schema";
import type { ContactState } from "./state";

/**
 * The contact submission, independent of Next (the Server Action wraps it).
 * - honeypot filled → pretend success, send nothing
 * - invalid → field errors
 * - mail not configured → "disabled"
 * - otherwise send via Resend → "success" / "error"
 * Never throws.
 */
export async function submitContact(
  values: ContactValues,
  env: MailEnv,
  fetchImpl: typeof fetch = fetch,
): Promise<ContactState> {
  if (values.website.trim() !== "") return { status: "success" };
  const parsed = validateContact(values);
  if (!parsed.success) return { status: "invalid", errors: parsed.errors };
  if (!isMailConfigured(env)) return { status: "disabled" };
  const payload = buildContactEmail(parsed.data, { ...env, CONTACT_TO: env.CONTACT_TO! });
  const ok = await sendContactEmail(payload, env.RESEND_API_KEY!, fetchImpl);
  return ok ? { status: "success" } : { status: "error" };
}
