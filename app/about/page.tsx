import type { Metadata } from "next";
import { content } from "@/lib/content";
import { aboutSections, businessSummaryItems } from "@/lib/page/about";
import { PageHeader } from "@/components/page/page-header";
import { Philosophy } from "@/components/sections/about/philosophy";
import { Greeting } from "@/components/sections/about/greeting";
import { CompanyProfile } from "@/components/sections/about/company-profile";
import { History } from "@/components/sections/about/history";
import { Access } from "@/components/sections/about/access";
import { AboutCta } from "@/components/sections/about/about-cta";

export const metadata: Metadata = {
  title: "会社概要",
  description:
    "遊栄JAPAN株式会社の企業理念と会社概要。仙台・国分町を拠点に、ナイトエンターテインメント・飲食・デジタルサイネージ・Web開発を展開しています。",
};

export default async function AboutPage() {
  const [company, businesses] = await Promise.all([content.getCompany(), content.getBusinesses()]);
  // Which sections render (drafts are dropped in production) is decided in
  // one tested place: lib/page/about.ts.
  const show = new Set(aboutSections(company));

  return (
    <>
      <PageHeader
        eyebrow="ABOUT / 会社概要"
        title={
          <>
            <span className="inline-block">街とともに、</span>
            <span className="inline-block">次の価値へ。</span>
          </>
        }
        lead="仙台・国分町を拠点に、飲食、エンターテインメント、デジタルサイネージ、そしてWebへ。領域を越えて、この街に新しい価値を届けています。"
        image={{ src: "/images/generated/about-hero.webp", alt: "朝霧に包まれた仙台の街並み" }}
        breadcrumbs={[{ href: "/", label: "ホーム" }, { label: "会社概要" }]}
      />
      {show.has("philosophy") && company.philosophy && <Philosophy philosophy={company.philosophy} />}
      {show.has("greeting") && company.greeting && <Greeting greeting={company.greeting} />}
      {show.has("profile") && (
        <CompanyProfile company={company} summary={businessSummaryItems(company.businessSummary, businesses)} />
      )}
      {show.has("history") && company.history && <History items={company.history} />}
      {show.has("access") && company.address && <Access address={company.address} tel={company.tel} />}
      {show.has("cta") && <AboutCta />}
    </>
  );
}
