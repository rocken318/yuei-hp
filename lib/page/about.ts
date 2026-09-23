/** Pure helpers for the /about page (app/about, components/sections/about). */

/**
 * Philosophy body lines shown under the heading. The body repeats the title
 * as its first line (it doubles as the home message), so a leading line equal
 * to the title is dropped; blank lines are removed.
 */
export function philosophyBody(philosophy: { title: string; body: string }): string {
  const lines = philosophy.body
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines[0] === philosophy.title.trim()) lines.shift();
  return lines.join("\n");
}

/** Greeting body ("\n\n"-separated paragraphs) → trimmed, non-empty paragraphs. */
export function paragraphs(body: string): string[] {
  return body
    .split(/\n\s*\n/u)
    .map((p) => p.trim())
    .filter(Boolean);
}

/** Whether the greeting is rendered: always when final, drafts only where drafts are shown. */
export function shouldShowGreeting(greeting: { draft: boolean } | undefined, drafts: boolean): boolean {
  if (!greeting) return false;
  return !greeting.draft || drafts;
}

export type SummaryItem = { label: string; href?: string };

/** Business summary names → items linking to /business/<slug> when a business has that name. */
export function businessSummaryItems(
  summary: readonly string[] | undefined,
  businesses: readonly { slug: string; name: string }[],
): SummaryItem[] {
  return (summary ?? []).map((label) => {
    const match = businesses.find((b) => b.name === label);
    return match ? { label, href: `/business/${match.slug}` } : { label };
  });
}

/** Google Maps search link for an address (no embed / API key needed). */
export function googleMapsUrl(address: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address.trim())}`;
}
