import type { Metadata } from "next";
import { content } from "@/lib/content";
import { Signage } from "@/components/sections/home/signage";
import { Numbers } from "@/components/sections/home/numbers";
import { Cta } from "@/components/sections/home/cta";

// Temporary preview of home sections 5–7 (removed in Plan 3 Task 7).
export const metadata: Metadata = {
  title: "Dev: sections B",
  robots: { index: false, follow: false },
};

export default async function SectionsBPreview() {
  const [businesses, nightlife, dining, signage] = await Promise.all([
    content.getBusinesses(),
    content.getVenues("nightlife"),
    content.getVenues("dining"),
    content.getVenues("signage"),
  ]);
  const storeCount = [...nightlife, ...dining].filter((v) => v.kind === "store").length;

  return (
    <>
      <div className="flex h-[70svh] items-end bg-surface-muted px-5 pb-10 md:px-8">
        <p className="font-display text-xs tracking-[0.3em] text-ink-muted">DEV PREVIEW — SECTIONS 5–7 ↓</p>
      </div>
      <Signage venues={signage} />
      <Numbers businessCount={businesses.length} storeCount={storeCount} signageCount={signage.length} />
      <Cta />
    </>
  );
}
