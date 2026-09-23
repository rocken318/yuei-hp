import type { Metadata } from "next";
import { content } from "@/lib/content";
import { Message } from "@/components/sections/home/message";
import { Businesses } from "@/components/sections/home/businesses";
import { BusinessMarquee } from "@/components/sections/home/business-marquee";

// Temporary preview of home sections (Plan 3). Removed in Task 7.
export const metadata: Metadata = {
  title: "Preview: home sections A",
  robots: { index: false, follow: false },
};

export default async function SectionsAPreview() {
  const businesses = await content.getBusinesses();
  return (
    <>
      <div className="flex h-svh items-center justify-center bg-surface-muted">
        <p className="font-display text-sm tracking-[0.3em] text-ink-muted">HERO PLACEHOLDER</p>
      </div>
      <div data-shot="message">
        <Message />
      </div>
      <div data-shot="businesses">
        <Businesses businesses={businesses} />
      </div>
      <div data-shot="marquee">
        <BusinessMarquee />
      </div>
      <div className="h-svh bg-surface-muted" />
    </>
  );
}
