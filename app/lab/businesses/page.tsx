import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { content } from "@/lib/content";
import { Businesses } from "@/components/sections/home/businesses";
import { BusinessMarquee } from "@/components/sections/home/business-marquee";
import { titleParts } from "@/components/sections/business/title-parts";
import { BusinessLab, BusinessLabFrame } from "@/components/lab/business-lab";
import type { LabBusiness } from "@/components/lab/business-variants/types";
import { VariantBHorizontal } from "@/components/lab/business-variants/variant-b-horizontal";
import { VariantCSplit } from "@/components/lab/business-variants/variant-c-split";
import { VariantDWipe } from "@/components/lab/business-variants/variant-d-wipe";
import { VariantERotate } from "@/components/lab/business-variants/variant-e-rotate";

/**
 * Local comparison lab for the home page's business section: the current
 * stacking cards (A) against alternative scroll presentations (B–F),
 * picked with `?v=`. Internal only: 404 on Vercel production, noindex, and
 * not in the sitemap (lib/seo/sitemap.ts lists known routes only).
 */
export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "事業紹介スクロールラボ",
  robots: { index: false, follow: false },
};

export default async function BusinessLabPage() {
  if (process.env.VERCEL_ENV === "production") notFound();

  const all = await content.getBusinesses();
  const businesses: LabBusiness[] = all.map((b) => {
    const title = b.brand ?? b.name;
    return {
      slug: b.slug,
      title,
      titleParts: titleParts(title, b.titleDisplay),
      subName: b.brand ? b.name : undefined,
      nameEn: b.nameEn,
      lead: b.lead,
      summary: b.summary,
      heroImage: b.heroImage,
      href: `/business/${b.slug}`,
    };
  });
  const marqueeWords = all.map((b) => (b.brandEn ?? b.nameEn).toUpperCase());

  const slots = {
    a: <Businesses businesses={all} />,
    b: <VariantBHorizontal businesses={businesses} />,
    c: <VariantCSplit businesses={businesses} />,
    d: <VariantDWipe businesses={businesses} />,
    e: <VariantERotate businesses={businesses} />,
    f: <VariantERotate businesses={businesses} prismOnPhones />,
  };
  const after = (
    <>
      <BusinessMarquee words={marqueeWords} />
      {/* Stand-in for the next home section, to judge how the variant hands over. */}
      <section aria-label="次のセクション" className="bg-surface-muted">
        <div className="mx-auto flex min-h-[70svh] max-w-7xl flex-col justify-center px-5 py-24 md:px-8">
          <p className="font-display text-xs tracking-[0.3em] text-brand-blue">NEXT SECTION</p>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-ink-muted md:text-base">
            トップページでは、この後にサイネージのセクションが続きます。
          </p>
        </div>
      </section>
    </>
  );

  return (
    <Suspense fallback={<BusinessLabFrame variant={null} />}>
      <BusinessLab slots={slots} after={after} />
    </Suspense>
  );
}
