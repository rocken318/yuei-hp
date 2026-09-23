import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export type BreadcrumbItem = { href?: string; label: string };

type Props = { items: BreadcrumbItem[]; className?: string };

/**
 * Breadcrumb trail. The last item is the current page (aria-current, never a
 * link). Structured data (BreadcrumbList) is added separately (plan 6).
 */
export function Breadcrumbs({ items, className }: Props) {
  if (items.length === 0) return null;
  return (
    <nav aria-label="パンくずリスト" className={className}>
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-ink-muted">
        {items.map((item, i) => {
          const last = i === items.length - 1;
          return (
            <li key={`${i}-${item.label}`} className="flex items-center gap-2">
              {last || !item.href ? (
                <span aria-current={last ? "page" : undefined} className={cn(last && "text-ink")}>
                  {item.label}
                </span>
              ) : (
                <Link
                  href={item.href}
                  className="underline-offset-4 transition-colors duration-hover hover:text-brand-blue hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue"
                >
                  {item.label}
                </Link>
              )}
              {!last && <ChevronRight aria-hidden className="size-3 text-ink-muted/60" />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
