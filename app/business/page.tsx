import type { Metadata } from "next";
import { content, isVenueBusiness } from "@/lib/content";
import { PageHeader } from "@/components/page/page-header";
import { BusinessRow } from "@/components/sections/business/business-row";
import { BusinessCta } from "@/components/sections/business/business-cta";

export const metadata: Metadata = {
  title: "事業紹介",
  description:
    "ナイトエンターテインメント・飲食・デジタルサイネージ・Web開発。仙台・国分町を拠点に遊栄JAPANが展開する4つの事業をご紹介します。",
};

export default async function BusinessIndexPage() {
  const businesses = await content.getBusinesses();
  const tags = await Promise.all(
    businesses.map(async (b) =>
      isVenueBusiness(b.slug)
        ? (await content.getVenues(b.slug)).map((v) => v.name)
        : (b.services ?? []).map((s) => s.title),
    ),
  );

  return (
    <>
      <PageHeader
        eyebrow="BUSINESS"
        title={
          <>
            <span className="inline-block">4つの事業で、</span>
            <span className="inline-block">街に価値を。</span>
          </>
        }
        lead="夜の街のにぎわいから、食卓のひととき、街頭のビジョン、そしてWebまで。国分町を拠点に、人と街をつなぐ4つの事業を展開しています。"
        image={{ src: "/images/generated/business-hero.webp", alt: "並んだ4つのガラスのキューブ" }}
        breadcrumbs={[{ href: "/", label: "ホーム" }, { label: "事業紹介" }]}
      />

      <section aria-label="事業一覧" className="bg-surface py-24 md:py-36">
        <div className="mx-auto flex max-w-7xl flex-col gap-24 px-5 md:gap-36 md:px-8">
          {businesses.map((b, i) => (
            <BusinessRow key={b.slug} business={b} index={i} tags={tags[i]} />
          ))}
        </div>
      </section>

      <BusinessCta
        eyebrow="CONTACT"
        title="事業に関するご相談は、お気軽に。"
        body="広告掲載や制作のご依頼、協業のご相談など、お気軽にお問い合わせください。"
        actions={[
          { href: "/contact", label: "お問い合わせ" },
          { href: "/recruit", label: "採用情報" },
        ]}
      />
    </>
  );
}
