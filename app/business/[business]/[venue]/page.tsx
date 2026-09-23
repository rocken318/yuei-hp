import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { content, isVenueBusiness, type Venue } from "@/lib/content";
import { venueBusinessSlugs } from "@/lib/content/schema";
import { InfoTable, type InfoRow } from "@/components/page/info-table";
import { SwipeGallery } from "@/components/page/swipe-gallery";
import { VenueSwipeList } from "@/components/page/venue-swipe-list";
import { Reveal } from "@/components/effects/reveal";
import { SectionEyebrow } from "@/components/sections/home/section-eyebrow";
import { VenueHero } from "@/components/sections/venue/venue-hero";
import { visibleInfoRows } from "@/lib/page/info-rows";

export const dynamicParams = false;

export async function generateStaticParams() {
  const lists = await Promise.all(venueBusinessSlugs.map((b) => content.getVenues(b)));
  return lists.flat().map((v) => ({ business: v.business, venue: v.slug }));
}

async function load(params: PageProps<"/business/[business]/[venue]">["params"]) {
  const { business: businessSlug, venue: venueSlug } = await params;
  if (!isVenueBusiness(businessSlug)) notFound();
  const [business, venue, venues] = await Promise.all([
    content.getBusiness(businessSlug),
    content.getVenue(businessSlug, venueSlug),
    content.getVenues(businessSlug),
  ]);
  if (!business || !venue) notFound();
  return { business, venue, others: venues.filter((v) => v.slug !== venue.slug) };
}

export async function generateMetadata({ params }: PageProps<"/business/[business]/[venue]">): Promise<Metadata> {
  const { venue } = await load(params);
  return { title: venue.name, description: venue.catchcopy };
}

/** Plain paragraphs from the MDX body (blank-line separated). */
function paragraphs(body: string): string[] {
  return body
    .split(/\r?\n\s*\r?\n/)
    .map((p) => p.replace(/\s*\r?\n\s*/g, " ").trim())
    .filter(Boolean);
}

function infoRows(venue: Venue): InfoRow[] {
  const signage = venue.kind === "signage";
  return [
    { label: signage ? "所在地" : "住所", value: venue.address },
    { label: signage ? "稼働時間" : "営業時間", value: venue.hours },
    { label: signage ? "休止日" : "定休日", value: venue.closed },
    {
      label: "電話番号",
      value: venue.tel && (
        <a href={`tel:${venue.tel.replace(/[^\d+]/g, "")}`} className="text-brand-blue underline underline-offset-4 hover:text-brand-navy">
          {venue.tel}
        </a>
      ),
    },
    {
      label: "地図",
      value: venue.mapUrl && (
        <a
          href={venue.mapUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-brand-blue underline underline-offset-4 hover:text-brand-navy"
        >
          Google マップで見る
          <ArrowUpRight aria-hidden className="size-4" />
        </a>
      ),
    },
  ];
}

function externalLinks(venue: Venue): { label: string; href: string }[] {
  const links: { label: string; href?: string }[] = [
    { label: "公式サイト", href: venue.siteUrl },
    { label: "Instagram", href: venue.sns.instagram },
    { label: "X", href: venue.sns.x },
    { label: "TikTok", href: venue.sns.tiktok },
    { label: "LINE", href: venue.sns.line },
  ];
  return links.filter((l): l is { label: string; href: string } => Boolean(l.href));
}

export default async function VenuePage({ params }: PageProps<"/business/[business]/[venue]">) {
  const { business, venue, others } = await load(params);
  const signage = venue.kind === "signage";
  const body = paragraphs(venue.body);
  const rows = infoRows(venue);
  const hasInfo = visibleInfoRows(rows).length > 0;
  const links = externalLinks(venue);
  const gallery = venue.gallery.map((src, i) => ({ src, alt: `${venue.name} の写真 ${i + 1}` }));
  const businessHref = `/business/${business.slug}`;

  return (
    <>
      <VenueHero
        name={venue.name}
        nameEn={venue.nameEn}
        category={venue.category}
        catchcopy={venue.catchcopy}
        image={venue.heroImage}
        placeholderLabel={signage ? "YUEI VISION" : "YUEI JAPAN"}
        breadcrumbs={[
          { href: "/", label: "ホーム" },
          { href: "/business", label: "事業紹介" },
          { href: businessHref, label: business.name },
          { label: venue.name },
        ]}
      />

      {/* Intro */}
      <section aria-labelledby="venue-intro" className="bg-surface py-20 md:py-32">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 md:grid-cols-[minmax(0,4fr)_minmax(0,8fr)] md:gap-12 md:px-8">
          <Reveal>
            <SectionEyebrow>{signage ? "LOCATION" : "CONCEPT"}</SectionEyebrow>
            <p className="mt-4 text-xs font-bold tracking-[0.15em] text-ink-muted">
              {business.name}
            </p>
          </Reveal>
          <Reveal delay={0.08}>
            <h2
              id="venue-intro"
              className="text-[1.75rem] font-bold leading-[1.5] text-ink [word-break:auto-phrase] md:text-5xl md:leading-[1.4]"
            >
              {venue.catchcopy}
            </h2>
            {body.length > 0 && (
              <div className="mt-8 max-w-2xl space-y-5 text-sm leading-[2.1] text-ink-muted [word-break:auto-phrase] md:mt-10 md:text-base">
                {body.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
            )}
          </Reveal>
        </div>

        {/* Gallery */}
        {gallery.length > 0 && (
          <div className="mx-auto mt-16 max-w-7xl px-5 md:mt-24 md:px-8">
            <div className="mb-6 flex items-end justify-between md:mb-8">
              <p className="font-display text-xs tracking-[0.3em] text-brand-blue">GALLERY</p>
            </div>
            {gallery.length >= 2 ? (
              <SwipeGallery images={gallery} label={`${venue.name} のギャラリー`} />
            ) : (
              <Reveal>
                <div className="relative aspect-[4/3] overflow-hidden rounded-card bg-surface-muted md:aspect-[21/9]">
                  <Image
                    src={gallery[0].src}
                    alt={gallery[0].alt}
                    fill
                    sizes="(min-width: 80rem) 76rem, calc(100vw - 2.5rem)"
                    className="object-cover"
                  />
                </div>
              </Reveal>
            )}
          </div>
        )}
      </section>

      {/* Information */}
      <section aria-labelledby="venue-info" className="border-t border-line bg-surface py-20 md:py-32">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 md:grid-cols-[minmax(0,4fr)_minmax(0,8fr)] md:gap-12 md:px-8">
          <Reveal>
            <SectionEyebrow>INFORMATION</SectionEyebrow>
            <h2 id="venue-info" className="mt-5 text-2xl font-bold text-ink md:text-3xl">
              {signage ? "拠点情報" : "店舗情報"}
            </h2>
            {links.length > 0 && (
              <ul className="mt-8 flex flex-wrap gap-3">
                {links.map((l) => (
                  <li key={l.label}>
                    <a
                      href={l.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-11 items-center gap-2 rounded-full border border-line px-5 text-sm font-bold text-ink transition-colors duration-hover hover:border-brand-blue hover:bg-brand-blue hover:text-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue"
                    >
                      {l.label}
                      <ArrowUpRight aria-hidden className="size-4" />
                      <span className="sr-only">（新しいタブで開く）</span>
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </Reveal>
          <Reveal delay={0.08}>
            {hasInfo ? (
              <InfoTable rows={rows} />
            ) : (
              <p
                data-testid="venue-info-pending"
                className="rounded-card border border-dashed border-line bg-surface-muted px-6 py-10 text-center text-sm leading-[1.9] text-ink-muted"
              >
                {signage ? "拠点情報は準備中です。" : "店舗情報は準備中です。"}
                <br />
                公開まで今しばらくお待ちください。
              </p>
            )}

            {signage && (
              <div className="mt-10 flex flex-col items-start gap-5 rounded-card bg-brand-navy p-7 text-surface md:mt-12 md:flex-row md:items-center md:justify-between md:p-9">
                <div>
                  <p className="font-display text-xs tracking-[0.3em] text-brand-sky">ADVERTISING</p>
                  <p className="mt-3 text-lg font-bold md:text-xl">{venue.name}への広告掲載をご検討の方へ</p>
                </div>
                <Link
                  href="/contact?type=signage"
                  className="group inline-flex min-h-12 shrink-0 items-center gap-2 rounded-full bg-surface px-6 text-sm font-bold text-brand-navy transition-colors duration-hover hover:bg-brand-sky focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-sky"
                >
                  広告掲載のご相談
                  <ArrowRight aria-hidden className="size-4 transition-transform duration-hover group-hover:translate-x-1" />
                </Link>
              </div>
            )}
          </Reveal>
        </div>
      </section>

      {/* Other venues in the same business */}
      <section aria-labelledby="venue-others" className="bg-surface-muted py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <div className="mb-10 flex flex-wrap items-end justify-between gap-4 md:mb-12">
            <div>
              <SectionEyebrow>{signage ? "OTHER LOCATIONS" : "OTHER STORES"}</SectionEyebrow>
              <h2 id="venue-others" className="mt-5 text-2xl font-bold text-ink md:text-3xl">
                {signage ? "他の拠点" : "他の店舗"}
              </h2>
            </div>
            <Link
              href={businessHref}
              className="group inline-flex items-center gap-2 text-sm font-bold text-brand-blue underline-offset-4 hover:underline"
            >
              {business.name}へ
              <ArrowRight aria-hidden className="size-4 transition-transform duration-hover group-hover:translate-x-1" />
            </Link>
          </div>
          <VenueSwipeList
            label={business.nameEn.toUpperCase()}
            columns={3}
            venues={others.map((v) => ({
              href: `/business/${v.business}/${v.slug}`,
              name: v.name,
              category: v.category,
              catchcopy: v.catchcopy,
              image: v.heroImage,
              placeholderLabel: signage ? "YUEI VISION" : "YUEI JAPAN",
            }))}
          />
        </div>
      </section>
    </>
  );
}
