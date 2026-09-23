import { cache } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { content, type NewsItem } from "@/lib/content";
import { Breadcrumbs } from "@/components/page/breadcrumbs";
import { NewsCategory } from "@/components/page/news-category";
import { adjacentNews, formatNewsDate } from "@/lib/page/news";
import { paragraphs } from "@/lib/page/text";

export const dynamicParams = false;

export async function generateStaticParams() {
  return (await content.getNews()).map((n) => ({ slug: n.slug }));
}

type Props = PageProps<"/news/[slug]">;

/** Page data, memoized per request (shared by generateMetadata and the page). */
const load = cache(async (slug: string) => {
  const news = await content.getNews();
  const item = news.find((n) => n.slug === slug);
  if (!item) notFound();
  return { item, ...adjacentNews(news, slug) };
});

/** The excerpt, else the first paragraph (trimmed to a description length). */
function description(item: NewsItem): string {
  const text = item.excerpt ?? paragraphs(item.body)[0] ?? item.title;
  return text.length > 120 ? `${text.slice(0, 119)}…` : text;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { item } = await load(slug);
  return { title: item.title, description: description(item) };
}

const adjacentLinkClass =
  "group flex h-full flex-col gap-2 rounded-card border border-line p-5 transition-colors duration-hover hover:border-brand-blue/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue md:p-6";

export default async function NewsArticlePage({ params }: Props) {
  const { slug } = await params;
  const { item, newer, older } = await load(slug);
  const body = paragraphs(item.body);
  const hasAdjacent = Boolean(older || newer);

  return (
    <article className="bg-surface pb-24 pt-24 md:pb-36 md:pt-32">
      <div className="mx-auto max-w-3xl px-5 md:px-8">
        <Breadcrumbs
          items={[{ href: "/", label: "ホーム" }, { href: "/news", label: "お知らせ" }, { label: item.title }]}
          className="mb-10 md:mb-14"
        />
        <header className="border-b border-line pb-8 md:pb-10">
          <div className="flex items-center gap-4">
            <time dateTime={item.date} className="font-display text-sm tracking-[0.08em] tabular-nums text-ink-muted">
              {formatNewsDate(item.date)}
            </time>
            <NewsCategory category={item.category} />
          </div>
          <h1 className="mt-5 text-2xl font-bold leading-[1.5] text-ink [word-break:auto-phrase] md:mt-6 md:text-4xl md:leading-[1.45]">
            {item.title}
          </h1>
        </header>

        <div className="mt-10 space-y-6 text-[0.9375rem] leading-[2.1] text-ink [word-break:auto-phrase] md:mt-12 md:text-base">
          {body.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>

        <nav aria-label="前後のお知らせ" className="mt-16 border-t border-line pt-10 md:mt-24">
          {hasAdjacent && (
            <ul className="grid gap-3 sm:grid-cols-2">
              <li>
                {older && (
                  <Link href={`/news/${older.slug}`} className={adjacentLinkClass}>
                    <span className="inline-flex items-center gap-2 font-display text-xs tracking-[0.2em] text-brand-blue">
                      <ArrowLeft aria-hidden className="size-3.5 transition-transform duration-hover group-hover:-translate-x-1" />
                      PREV
                    </span>
                    <span className="text-sm font-bold leading-[1.7] text-ink [word-break:auto-phrase]">{older.title}</span>
                  </Link>
                )}
              </li>
              <li>
                {newer && (
                  <Link href={`/news/${newer.slug}`} className={`${adjacentLinkClass} sm:items-end sm:text-right`}>
                    <span className="inline-flex items-center gap-2 font-display text-xs tracking-[0.2em] text-brand-blue">
                      NEXT
                      <ArrowRight aria-hidden className="size-3.5 transition-transform duration-hover group-hover:translate-x-1" />
                    </span>
                    <span className="text-sm font-bold leading-[1.7] text-ink [word-break:auto-phrase]">{newer.title}</span>
                  </Link>
                )}
              </li>
            </ul>
          )}
          <div className={hasAdjacent ? "mt-10 text-center" : "text-center"}>
            <Link
              href="/news"
              className="group inline-flex min-h-12 items-center gap-2 rounded-full border border-brand-blue px-7 text-sm font-bold text-brand-blue transition-colors duration-hover hover:bg-brand-blue hover:text-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue"
            >
              お知らせ一覧へ
              <ArrowRight aria-hidden className="size-4 transition-transform duration-hover group-hover:translate-x-1" />
            </Link>
          </div>
        </nav>
      </div>
    </article>
  );
}
