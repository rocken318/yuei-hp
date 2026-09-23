import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { NewsItem } from "@/lib/content/schema";
import { formatNewsDate } from "@/lib/page/news";
import { cn } from "@/lib/utils";
import { NewsCategory } from "./news-category";

export type NewsListItem = Pick<NewsItem, "slug" | "title" | "date" | "category">;

type Props = { items: NewsListItem[]; className?: string };

/**
 * News rows: date, category chip and title, each row linking to the article.
 * Phones: date + chip on one line, the title below. md+: one line per item.
 * With no items, a short "no news" note is shown instead.
 */
export function NewsList({ items, className }: Props) {
  if (items.length === 0) {
    return <p className={cn("text-sm text-ink-muted", className)}>現在、お知らせはありません。</p>;
  }
  return (
    <ul data-testid="news-list" className={cn("border-t border-line", className)}>
      {items.map((item) => (
        <li key={item.slug} className="border-b border-line">
          <Link
            href={`/news/${item.slug}`}
            className="group grid gap-2.5 py-6 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue md:grid-cols-[13rem_minmax(0,1fr)_auto] md:items-center md:gap-8 md:py-7"
          >
            <span className="flex items-center gap-4">
              <time dateTime={item.date} className="font-display text-sm tracking-[0.08em] tabular-nums text-ink-muted">
                {formatNewsDate(item.date)}
              </time>
              <NewsCategory category={item.category} />
            </span>
            <span className="font-bold leading-[1.8] text-ink [word-break:auto-phrase] transition-colors duration-hover group-hover:text-brand-blue md:text-[1.0625rem]">
              {item.title}
            </span>
            <ArrowRight
              aria-hidden
              className="hidden size-4 text-brand-blue transition-transform duration-hover group-hover:translate-x-1 md:block"
            />
          </Link>
        </li>
      ))}
    </ul>
  );
}
