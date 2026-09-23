import { content } from "@/lib/content";
import { Hero } from "@/components/sections/home/hero";
import { Message } from "@/components/sections/home/message";
import { Businesses } from "@/components/sections/home/businesses";
import { BusinessMarquee } from "@/components/sections/home/business-marquee";
import { Signage } from "@/components/sections/home/signage";
import { Numbers } from "@/components/sections/home/numbers";
import { News } from "@/components/sections/home/news";
import { Cta } from "@/components/sections/home/cta";

export default async function HomePage() {
  const [businesses, nightlife, dining, signage, news] = await Promise.all([
    content.getBusinesses(),
    content.getVenues("nightlife"),
    content.getVenues("dining"),
    content.getVenues("signage"),
    content.getNews(),
  ]);
  const storeCount = [...nightlife, ...dining].filter((v) => v.kind === "store").length;
  // The client Signage section only needs these fields.
  const signageVenues = signage.map(({ slug, name, catchcopy, heroImage }) => ({ slug, name, catchcopy, heroImage }));
  const latestNews = news.slice(0, 3).map(({ slug, title, date, category }) => ({ slug, title, date, category }));
  const marqueeWords = businesses.map((b) => (b.brandEn ?? b.nameEn).toUpperCase());

  return (
    <>
      <Hero />
      <Message />
      <Businesses businesses={businesses} />
      <BusinessMarquee words={marqueeWords} />
      <Signage venues={signageVenues} />
      <Numbers businessCount={businesses.length} storeCount={storeCount} signageCount={signage.length} />
      <News items={latestNews} />
      <Cta />
    </>
  );
}
