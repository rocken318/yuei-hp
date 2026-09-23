import type { Metadata } from "next";
import { PageHeader } from "@/components/page/page-header";
import { InfoTable } from "@/components/page/info-table";
import { SwipeGallery } from "@/components/page/swipe-gallery";
import { VenueSwipeList } from "@/components/page/venue-swipe-list";
import { DraftBadge } from "@/components/page/draft-badge";
import { SectionEyebrow } from "@/components/sections/home/section-eyebrow";

// TEMPORARY preview of the shared page components (plan 4, task 2).
// Deleted in task 6.
export const metadata: Metadata = {
  title: "Page kit (dev)",
  robots: { index: false, follow: false },
};

const EN = "/images/source/en";
const gallery = [
  { src: `${EN}/interior-01.webp`, alt: "焼肉En 店内の様子" },
  { src: `${EN}/dish-01.webp`, alt: "焼肉En 料理 1" },
  { src: `${EN}/dish-02.webp`, alt: "焼肉En 料理 2" },
  { src: `${EN}/dish-03.webp`, alt: "焼肉En 料理 3" },
  { src: `${EN}/interior-02.webp`, alt: "焼肉En 店内の様子 2" },
  { src: `${EN}/dish-04.webp`, alt: "焼肉En 料理 4" },
  { src: `${EN}/dish-05.webp`, alt: "焼肉En 料理 5" },
  { src: `${EN}/dish-06.webp`, alt: "焼肉En 料理 6" },
  { src: `${EN}/exterior.webp`, alt: "焼肉En 外観" },
  { src: `${EN}/dish-07.webp`, alt: "焼肉En 料理 7" },
  { src: `${EN}/dish-09.webp`, alt: "焼肉En 料理 9" },
  { src: `${EN}/interior-03.webp`, alt: "焼肉En 店内の様子 3" },
];

const venues = [
  {
    href: "/business/nightlife/kingyo",
    name: "KINGYO",
    category: "キャバクラ",
    catchcopy: "金魚が舞う、非日常のラグジュアリー空間",
    image: "/images/source/kingyo/parallax-wagara.webp",
  },
  {
    href: "/business/nightlife/b-club",
    name: "B-club",
    category: "キャバクラ",
    catchcopy: "光のアートに包まれる夜",
    image: "/images/source/b-club/light-01.webp",
  },
  {
    href: "/business/nightlife/c-girl",
    name: "C-girl",
    category: "ガールズバー",
    catchcopy: "レトロフューチャーなネオンのガールズバー",
    image: "/images/source/c-girl/exterior.webp",
  },
  {
    href: "/business/signage/eiraku",
    name: "エーラクビル",
    category: "遊栄ビジョン",
    catchcopy: "国分町エリアのビジョン",
    placeholderLabel: "YUEI VISION",
  },
];

export default function PageKitPreview() {
  return (
    <>
      <PageHeader
        eyebrow="BUSINESS"
        title={<>街の夜を、<br />もっと面白く。</>}
        lead="PageHeader の確認用です。タイトルは即時表示（LCP）、画像はスクロールでゆっくり動きます（視差効果を減らす設定では静止）。"
        image={{ src: "/images/source/kingyo/parallax-goldfish.webp", alt: "金魚鉢のイメージ" }}
        breadcrumbs={[{ href: "/", label: "トップ" }, { href: "/business", label: "事業紹介" }, { label: "ナイトエンターテインメント" }]}
      />

      <div className="mx-auto max-w-7xl space-y-24 px-5 py-24 md:space-y-32 md:px-8 md:py-32">
        <section aria-labelledby="kit-gallery">
          <SectionEyebrow>GALLERY</SectionEyebrow>
          <h2 id="kit-gallery" className="mb-8 mt-4 text-2xl font-bold md:mb-12 md:text-4xl">
            SwipeGallery
          </h2>
          <SwipeGallery images={gallery} label="焼肉En ギャラリー" />
        </section>

        <section aria-labelledby="kit-venues">
          <SectionEyebrow>LOCATIONS</SectionEyebrow>
          <h2 id="kit-venues" className="mb-8 mt-4 text-2xl font-bold md:mb-12 md:text-4xl">
            VenueSwipeList
          </h2>
          <VenueSwipeList venues={venues} label="店舗一覧" columns={4} />
        </section>

        <section aria-labelledby="kit-info" className="grid gap-10 md:grid-cols-[minmax(0,4fr)_minmax(0,8fr)] md:gap-16">
          <div>
            <SectionEyebrow>INFORMATION</SectionEyebrow>
            <h2 id="kit-info" className="mt-4 text-2xl font-bold md:text-4xl">
              InfoTable
            </h2>
            <DraftBadge className="mt-6" />
          </div>
          <InfoTable
            rows={[
              { label: "店名", value: "焼肉En" },
              { label: "ジャンル", value: "焼肉" },
              { label: "住所" },
              { label: "営業時間", value: "" },
              {
                label: "公式サイト",
                value: (
                  <a href="#" className="text-brand-blue underline underline-offset-4">
                    （リンク例）
                  </a>
                ),
              },
            ]}
          />
        </section>
      </div>
    </>
  );
}
