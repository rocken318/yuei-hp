import type { Metadata } from "next";
import { content, type Business, type Venue } from "@/lib/content";
import { Reveal } from "@/components/effects/reveal";
import { PageHeader } from "@/components/page/page-header";
import { VenueSwipeList } from "@/components/page/venue-swipe-list";
import { SectionEyebrow } from "@/components/sections/home/section-eyebrow";
import { BusinessCta } from "@/components/sections/business/business-cta";

export const metadata: Metadata = {
  title: "採用情報",
  description:
    "遊栄JAPANの採用情報。ナイトエンターテインメント・飲食の各店舗の採用情報は、各店舗のサイトで公開予定です。",
};

/** Businesses whose stores recruit on their own sites. */
const STORE_BUSINESSES = ["nightlife", "dining"] as const;

export default async function RecruitPage() {
  const groups = (
    await Promise.all(
      STORE_BUSINESSES.map(async (slug) => ({
        business: await content.getBusiness(slug),
        venues: await content.getVenues(slug),
      })),
    )
  ).filter((g): g is { business: Business; venues: Venue[] } => !!g.business && g.venues.length > 0);

  return (
    <>
      <PageHeader
        eyebrow="RECRUIT"
        title="採用情報"
        lead="国分町の夜と食の現場で、お客様の特別な時間をともにつくる。遊栄JAPANの各店舗の採用についてご案内します。"
        image={{ src: "/images/generated/recruit-banner.webp", alt: "夕暮れの並木道を並んで歩く4人の後ろ姿" }}
        breadcrumbs={[{ href: "/", label: "ホーム" }, { label: "採用情報" }]}
      />

      <section aria-labelledby="recruit-notice-heading" className="bg-surface py-24 md:py-36">
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <Reveal className="grid gap-8 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] md:gap-16">
            <div>
              <SectionEyebrow>INFORMATION</SectionEyebrow>
              <h2
                id="recruit-notice-heading"
                className="mt-4 text-[1.75rem] font-bold leading-[1.4] text-balance text-ink md:text-4xl md:leading-[1.35]"
              >
                <span className="inline-block">採用情報は、</span>
                <span className="inline-block">各店舗のサイトで</span>
                <span className="inline-block">公開予定です。</span>
              </h2>
            </div>
            <div className="grid gap-5 text-sm leading-[2] text-ink-muted [word-break:auto-phrase] md:pt-12 md:text-base">
              <p>
                ナイトエンターテインメント・飲食の各店舗では、店舗ごとにコンセプトや働き方が異なります。採用に関する情報は、準備が整い次第、各店舗のサイトでお知らせします。
              </p>
              <p>各店舗の雰囲気は、下の店舗紹介からご覧いただけます。採用についてのご質問は、お問い合わせフォームからお寄せください。</p>
            </div>
          </Reveal>
        </div>
      </section>

      {groups.length > 0 && (
        <section data-testid="venues" aria-labelledby="recruit-stores-heading" className="bg-surface-muted py-24 md:py-36">
          <div className="mx-auto max-w-7xl px-5 md:px-8">
            <Reveal className="mb-10 md:mb-16">
              <SectionEyebrow>STORES</SectionEyebrow>
              <h2 id="recruit-stores-heading" className="mt-4 text-3xl font-bold text-ink md:text-5xl">
                店舗紹介
              </h2>
            </Reveal>
            <div className="space-y-16 md:space-y-24">
              {groups.map(({ business, venues }) => (
                <VenueSwipeList
                  key={business.slug}
                  label={`${business.name}｜全${venues.length}店舗`}
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
              ))}
            </div>
          </div>
        </section>
      )}

      <BusinessCta
        eyebrow="CONTACT"
        title="採用についてのご質問は、お気軽にどうぞ。"
        body="お問い合わせフォームの種別「取材・その他」からお送りください。内容を確認のうえ、担当者よりご連絡いたします。"
        actions={[{ href: "/contact?type=other", label: "お問い合わせ" }]}
        className="pt-16 md:pt-24"
      />
    </>
  );
}
