import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site";

/** Pages that exist regardless of content. */
export const STATIC_ROUTES = ["/", "/about", "/business", "/news", "/recruit", "/contact", "/privacy"] as const;

export type SitemapInput = {
  baseUrl: string;
  businesses: readonly string[];
  venues: readonly { business: string; slug: string }[];
  /** "YYYY-MM-DD" publication days. */
  news: readonly { slug: string; date: string }[];
};

/**
 * Every public URL. lastModified only where the content knows a date: each
 * news article (its day), and /news and / (the newest article — both list it).
 */
export function buildSitemapEntries({ baseUrl, businesses, venues, news }: SitemapInput): MetadataRoute.Sitemap {
  const url = (path: string) => absoluteUrl(path, baseUrl);
  const latest = news.map((n) => n.date).sort().at(-1);
  const withLatest = new Set<string>(["/", "/news"]);

  return [
    ...STATIC_ROUTES.map((path) => ({
      url: url(path),
      ...(latest && withLatest.has(path) && { lastModified: latest }),
    })),
    ...businesses.map((b) => ({ url: url(`/business/${b}`) })),
    ...venues.map((v) => ({ url: url(`/business/${v.business}/${v.slug}`) })),
    ...news.map((n) => ({ url: url(`/news/${n.slug}`), lastModified: n.date })),
  ];
}
