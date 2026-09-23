import type { MetadataRoute } from "next";
import { content, venueBusinessSlugs } from "@/lib/content";
import { buildSitemapEntries } from "@/lib/seo/sitemap";
import { SITE_URL } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [businesses, venueLists, news] = await Promise.all([
    content.getBusinesses(),
    Promise.all(venueBusinessSlugs.map((b) => content.getVenues(b))),
    content.getNews(),
  ]);
  return buildSitemapEntries({
    baseUrl: SITE_URL,
    businesses: businesses.map((b) => b.slug),
    venues: venueLists.flat().map((v) => ({ business: v.business, slug: v.slug })),
    news: news.map((n) => ({ slug: n.slug, date: n.date })),
  });
}
