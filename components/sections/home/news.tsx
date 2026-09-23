import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Reveal } from "@/components/effects/reveal";
import { NewsList, type NewsListItem } from "@/components/page/news-list";
import { SectionEyebrow } from "./section-eyebrow";

type Props = {
  /** The latest items (the page passes the newest 3). */
  items: NewsListItem[];
};

/** Home — お知らせ: the latest news and a link to the full list. */
export function News({ items }: Props) {
  return (
    <section data-testid="news" aria-labelledby="news-heading" className="bg-surface pb-24 md:pb-36">
      <div className="mx-auto grid max-w-7xl gap-8 px-5 md:grid-cols-[minmax(0,4fr)_minmax(0,8fr)] md:gap-12 md:px-8">
        <Reveal className="flex items-end justify-between gap-6 md:flex-col md:items-start md:justify-start md:gap-10">
          <div>
            <SectionEyebrow>NEWS</SectionEyebrow>
            <h2 id="news-heading" className="mt-5 text-[1.75rem] font-bold leading-[1.35] md:text-4xl">
              お知らせ
            </h2>
          </div>
          <Link
            href="/news"
            className="group inline-flex shrink-0 items-center gap-2 text-sm font-bold text-brand-blue underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue"
          >
            一覧を見る
            <ArrowRight aria-hidden className="size-4 transition-transform duration-hover group-hover:translate-x-1" />
          </Link>
        </Reveal>
        <Reveal delay={0.08}>
          <NewsList items={items} />
        </Reveal>
      </div>
    </section>
  );
}
