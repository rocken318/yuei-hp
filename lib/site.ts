// A production deploy without an explicit origin would publish canonical
// URLs / sitemap / JSON-LD pointing at the fallback vercel.app domain.
if (process.env.VERCEL_ENV === "production" && !process.env.NEXT_PUBLIC_SITE_URL) {
  console.warn(
    "lib/site: NEXT_PUBLIC_SITE_URL is not set in production; falling back to https://yuei-hp.vercel.app for canonical URLs.",
  );
}

/** Public origin of the site (no trailing slash). Override with NEXT_PUBLIC_SITE_URL. */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://yuei-hp.vercel.app").replace(/\/+$/, "");

/** Short site name (og:site_name, title template suffix). */
export const SITE_NAME = "遊栄JAPAN";

/** Absolute URL for a site path ("/about" → "https://…/about"). */
export function absoluteUrl(path: string, base: string = SITE_URL): string {
  return new URL(path, `${base}/`).toString();
}
