/** Public origin of the site (no trailing slash). Override with NEXT_PUBLIC_SITE_URL. */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://yuei-hp.vercel.app").replace(/\/+$/, "");

/** Short site name (og:site_name, title template suffix). */
export const SITE_NAME = "遊栄JAPAN";

/** Absolute URL for a site path ("/about" → "https://…/about"). */
export function absoluteUrl(path: string, base: string = SITE_URL): string {
  return new URL(path, `${base}/`).toString();
}
