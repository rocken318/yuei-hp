import { content } from "@/lib/content";
import { Hero } from "@/components/sections/home/hero";
import { Message } from "@/components/sections/home/message";
import { Businesses } from "@/components/sections/home/businesses";
import { BusinessMarquee } from "@/components/sections/home/business-marquee";
import { Signage } from "@/components/sections/home/signage";
import { Numbers } from "@/components/sections/home/numbers";
import { Cta } from "@/components/sections/home/cta";

export default async function HomePage() {
  const [businesses, nightlife, dining, signage] = await Promise.all([
    content.getBusinesses(),
    content.getVenues("nightlife"),
    content.getVenues("dining"),
    content.getVenues("signage"),
  ]);
  const storeCount = [...nightlife, ...dining].filter((v) => v.kind === "store").length;

  return (
    <>
      <Hero />
      <Message />
      <Businesses businesses={businesses} />
      <BusinessMarquee />
      <Signage venues={signage} />
      <Numbers businessCount={businesses.length} storeCount={storeCount} signageCount={signage.length} />
      <Cta />
    </>
  );
}
