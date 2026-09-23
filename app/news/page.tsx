import type { Metadata } from "next";
import { content } from "@/lib/content";
import { PageHeader } from "@/components/page/page-header";
import { NewsList } from "@/components/page/news-list";
import { Reveal } from "@/components/effects/reveal";

export const metadata: Metadata = {
  title: "お知らせ",
  description: "遊栄Japan株式会社からのお知らせ一覧です。",
};

export default async function NewsIndexPage() {
  const news = await content.getNews();

  return (
    <>
      <PageHeader
        eyebrow="NEWS / お知らせ"
        title="お知らせ"
        lead="遊栄Japan株式会社からのお知らせをお届けします。"
        breadcrumbs={[{ href: "/", label: "ホーム" }, { label: "お知らせ" }]}
      />
      <section aria-label="お知らせ一覧" className="bg-surface pb-24 pt-14 md:pb-36 md:pt-20">
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <Reveal>
            <NewsList items={news} />
          </Reveal>
        </div>
      </section>
    </>
  );
}
