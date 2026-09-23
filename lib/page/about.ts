/** Pure helpers for the /about page (app/about, components/sections/about). */

import type { Company } from "@/lib/content/schema";
import { showDrafts } from "@/lib/draft";

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

/** Whether the greeting is rendered: always when final, drafts only where drafts are shown. */
export function shouldShowGreeting(greeting: { draft: boolean } | undefined, drafts: boolean): boolean {
  if (!greeting) return false;
  return !greeting.draft || drafts;
}

export type AboutSection = "philosophy" | "greeting" | "profile" | "history" | "access" | "cta";

/**
 * Sections /about renders, in order. Optional content drops its section; a
 * draft greeting is left out where drafts are hidden (production, see
 * lib/draft.ts) so it never reaches the live site.
 */
export function aboutSections(
  company: Pick<Company, "philosophy" | "greeting" | "history" | "address">,
  env: Record<string, string | undefined> = process.env,
): AboutSection[] {
  const sections: AboutSection[] = [];
  if (company.philosophy) sections.push("philosophy");
  if (shouldShowGreeting(company.greeting, showDrafts(env))) sections.push("greeting");
  sections.push("profile");
  if ((company.history ?? []).length > 0) sections.push("history");
  if (company.address) sections.push("access");
  sections.push("cta");
  return sections;
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
