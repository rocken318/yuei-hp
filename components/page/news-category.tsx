import type { NewsCategory as Category } from "@/lib/content/schema";
import { cn } from "@/lib/utils";

/** Small category chip for a news item (お知らせ / 店舗 / 採用 / メディア). */
export function NewsCategory({ category, className }: { category: Category; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex min-w-[4.5rem] shrink-0 items-center justify-center rounded-full border border-brand-blue/20 bg-brand-sky/25 px-3 py-0.5 text-[0.6875rem] font-bold tracking-[0.08em] text-brand-blue",
        className,
      )}
    >
      {category}
    </span>
  );
}
