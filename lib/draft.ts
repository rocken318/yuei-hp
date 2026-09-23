/**
 * Whether draft content (e.g. `greeting.draft: true`) should be rendered.
 * Hidden in production (`VERCEL_ENV === "production"`); shown in previews and locally.
 */
export function showDrafts(env: Record<string, string | undefined> = process.env): boolean {
  return env.VERCEL_ENV !== "production";
}
