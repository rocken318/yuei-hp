import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo/metadata";
import { BreadcrumbJsonLd } from "@/components/seo/json-ld";
import { notFound } from "next/navigation";
import { content, isVenueBusiness, type Business, type BusinessSlug } from "@/lib/content";
import { Reveal } from "@/components/effects/reveal";
import { PageHeader } from "@/components/page/page-header";
import { TitleLines } from "@/components/page/title-lines";
import { VenueSwipeList } from "@/components/page/venue-swipe-list";
import { SectionEyebrow } from "@/components/sections/home/section-eyebrow";
import { BusinessCta, type BusinessCtaAction } from "@/components/sections/business/business-cta";
import { FlowTimeline } from "@/components/sections/business/flow-timeline";
import { ServiceGrid } from "@/components/sections/business/service-grid";
import { titleParts } from "@/components/sections/business/title-parts";

// Only the four businesses exist; anything else is a 404.
export const dynamicParams = false;

export async function generateStaticParams() {
  const businesses = await content.getBusinesses();
  return businesses.map((b) => ({ business: b.slug }));
}

export async function generateMetadata({ params }: PageProps<"/business/[business]">): Promise<Metadata> {
  const { business: slug } = await params;
  const business = await content.getBusiness(slug);
  if (!business) return {};
  return pageMetadata({
    title: business.brand ?? business.name,
    description: business.lead ?? business.summary,
    path: `/business/${business.slug}`,
  });
}

/** Closing call-to-action per business. */
const CTA: Record<BusinessSlug, { eyebrow: string; title: string; body: string; actions: BusinessCtaAction[] }> = {
  nightlife: {
    eyebrow: "RECRUIT",
    title: "国分町の夜を、一緒に彩りませんか。",
    body: "一人ひとりのお客様と真摯に向き合い、上質な時間をともにつくる。採用情報は各店舗のサイトで公開予定です。",
    actions: [
      { href: "/recruit", label: "採用について" },
      { href: "/contact?type=other", label: "お問い合わせ" },
    ],
  },
  dining: {
    eyebrow: "RECRUIT",
    title: "おもてなしの時間を、一緒につくりませんか。",
    body: "料理と空間で、また訪れたくなるお店をともにつくる。採用情報は各店舗のサイトで公開予定です。",
    actions: [
      { href: "/recruit", label: "採用について" },
      { href: "/contact?type=other", label: "お問い合わせ" },
    ],
  },
  signage: {
    eyebrow: "ADVERTISING",
    title: "遊栄ビジョンへの広告掲載をご検討の方へ",
    body: "掲載する場所や期間、放映する映像の制作まで、目的に合わせてご提案します。まずはお気軽にご相談ください。",
    actions: [{ href: "/contact?type=signage", label: "広告掲載のご相談" }],
  },
  digital: {
    eyebrow: "CONTACT",
    title: "Webサイト・映像の制作をご検討の方へ",
    body: "まだ内容が固まっていない段階でも構いません。目的やお悩みを伺いながら、最適な進め方をご提案します。",
    actions: [{ href: "/contact?type=web", label: "制作のご相談" }],
  },
};

export default async function BusinessPage({ params }: PageProps<"/business/[business]">) {
  const { business: slug } = await params;
  const business = await content.getBusiness(slug);
  if (!business) notFound();

  const title = business.brand ?? business.name;
  const venues = isVenueBusiness(business.slug) ? await content.getVenues(business.slug) : [];
  const cta = CTA[business.slug];
  const path = `/business/${business.slug}`;
  const crumbs = [{ href: "/", label: "ホーム" }, { href: "/business", label: "事業紹介" }, { label: title }];

  return (
    <>
      <PageHeader
        eyebrow={(business.brandEn ?? business.nameEn).toUpperCase()}
        title={<TitleLines parts={titleParts(title, business.titleDisplay)} />}
        lead={business.lead ?? business.summary}
        image={business.heroImage ? { src: business.heroImage, alt: `${title}のイメージ` } : undefined}
        breadcrumbs={crumbs}
      />
      <BreadcrumbJsonLd items={crumbs} path={path} />

      <Intro business={business} />

      {venues.length > 0 && (
        <section data-testid="venues" aria-labelledby="venues-heading" className="bg-surface-muted py-24 md:py-36">
          <div className="mx-auto max-w-7xl px-5 md:px-8">
            <Reveal className="mb-10 md:mb-16">
              <SectionEyebrow>{business.slug === "signage" ? "LOCATIONS" : "STORES"}</SectionEyebrow>
              <h2 id="venues-heading" className="mt-4 text-3xl font-bold text-ink md:text-5xl">
                {business.slug === "signage" ? "設置拠点" : "店舗一覧"}
              </h2>
            </Reveal>
            <VenueSwipeList
              label={business.slug === "signage" ? `全${venues.length}拠点` : `全${venues.length}店舗`}
              columns={venues.length >= 4 ? 4 : 3}
              venues={venues.map((v) => ({
                href: `/business/${business.slug}/${v.slug}`,
                name: v.name,
                category: v.category,
                catchcopy: v.catchcopy,
                image: v.heroImage,
                placeholderLabel: (business.brandEn ?? business.nameEn).toUpperCase(),
              }))}
            />
          </div>
        </section>
      )}

      {business.services && <ServiceGrid services={business.services} />}
      {business.flow && <FlowTimeline steps={business.flow} />}

      <BusinessCta {...cta} className={venues.length > 0 ? "pt-16 md:pt-24" : undefined} />
    </>
  );
}

/** Lead heading and description paragraphs. */
function Intro({ business }: { business: Business }) {
  const paragraphs = business.description ?? [business.summary];
  return (
    <section aria-labelledby="intro-heading" className="bg-surface py-24 md:py-36">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 md:px-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
        <Reveal>
          <SectionEyebrow>ABOUT</SectionEyebrow>
          <h2 id="intro-heading" className="mt-4 text-2xl font-bold leading-snug text-ink [word-break:auto-phrase] md:text-4xl md:leading-[1.4]">
            事業について
          </h2>
          {business.brand && (
            <p className="mt-3 font-display text-xs tracking-[0.25em] text-brand-blue">
              {business.brand} / {business.brandEn}
            </p>
          )}
        </Reveal>
        <div className="flex flex-col gap-6 md:gap-8">
          {paragraphs.map((p, i) => (
            <Reveal key={p} delay={i * 0.08}>
              <p className="text-base leading-[2.1] text-ink [word-break:auto-phrase] md:text-lg md:leading-[2.2]">{p}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
