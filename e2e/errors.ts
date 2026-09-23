import type { Page } from "@playwright/test";

/**
 * Routes later plans add. Until then, Link prefetches for them (the page and
 * its RSC variants: `?_rsc=…`, `.rsc`, `.segments/…`) 404 — expected.
 */
const FUTURE_ROUTE = /^\/(?:about|business|news|recruit|contact|privacy)(?:[/.].*)?$/;

export const isFutureRoute = (url: string) => FUTURE_ROUTE.test(new URL(url).pathname);

/**
 * Collects real problems on the page: uncaught errors, console errors, and
 * any HTTP response ≥ 400 except those for the future routes above — in
 * particular, a failing `/_next/image` (missing or unoptimisable image) is
 * always reported. Returns a getter for the collected list.
 */
export function watchErrors(page: Page) {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
  page.on("response", (res) => {
    if (res.status() < 400) return;
    const url = res.url();
    if (new URL(url).pathname.startsWith("/_next/image")) {
      errors.push(`image ${res.status()}: ${url}`);
    } else if (!isFutureRoute(url)) {
      errors.push(`http ${res.status()}: ${url}`);
    }
  });
  page.on("console", (m) => {
    if (m.type() !== "error") return;
    // Failed loads are judged by URL in the response listener above.
    if (m.text().startsWith("Failed to load resource")) return;
    errors.push(`console: ${m.text()}`);
  });
  return () => errors;
}
