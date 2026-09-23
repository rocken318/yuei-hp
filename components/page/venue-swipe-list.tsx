"use client";

import { useCallback, useId, useState, type UIEvent } from "react";
import { Reveal } from "@/components/effects/reveal";
import { snapIndex } from "@/lib/page/gallery";
import { cn, pad2 } from "@/lib/utils";
import { VenueCard, type VenueCardProps } from "./venue-card";

export type VenueSwipeItem = Omit<VenueCardProps, "index" | "tone" | "sizes" | "highlighted" | "onHighlightChange">;

type Props = {
  venues: VenueSwipeItem[];
  /** Small visible label above the list (also names the list for AT). */
  label: string;
  /** Desktop columns. */
  columns?: 3 | 4;
  tone?: "default" | "onDark";
};

const SIZES = {
  3: "(min-width: 1024px) 26rem, (min-width: 768px) 50vw, 78vw",
  4: "(min-width: 1024px) 19rem, (min-width: 768px) 50vw, 78vw",
} as const;

/**
 * Venue cards: a horizontal scroll-snap row with a "01 / 04" counter on
 * phones (the next card peeks in), a grid from md.
 */
export function VenueSwipeList({ venues, label, columns = 3, tone = "default" }: Props) {
  const labelId = useId();
  const [index, setIndex] = useState(0);
  const dark = tone === "onDark";

  const onScroll = useCallback(
    (e: UIEvent<HTMLUListElement>) => {
      const el = e.currentTarget;
      const first = el.firstElementChild as HTMLElement | null;
      if (!first) return;
      const step = first.offsetWidth + parseFloat(getComputedStyle(el).columnGap || "0");
      setIndex(snapIndex({ scrollLeft: el.scrollLeft, maxScroll: el.scrollWidth - el.clientWidth, step, count: venues.length }));
    },
    [venues.length],
  );

  if (venues.length === 0) return null;

  return (
    <div data-testid="venue-list">
      <div className="mb-5 flex items-end justify-between md:mb-8">
        <p id={labelId} className={cn("text-xs font-bold tracking-[0.2em]", dark ? "text-brand-sky" : "text-brand-blue")}>
          {label}
        </p>
        {venues.length > 1 && (
          <p
            data-testid="venue-list-counter"
            aria-hidden
            className={cn("font-display text-xs tracking-[0.2em] md:hidden", dark ? "text-surface/60" : "text-ink-muted")}
          >
            <span className={dark ? "text-surface" : "text-ink"}>{pad2(index + 1)}</span> / {pad2(venues.length)}
          </p>
        )}
      </div>
      <ul
        aria-labelledby={labelId}
        onScroll={onScroll}
        className={cn(
          "-mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain scroll-px-5 px-5 pb-2 [scrollbar-width:none] md:mx-0 md:grid md:grid-cols-2 md:gap-6 md:overflow-visible md:px-0 md:pb-0 [&::-webkit-scrollbar]:hidden",
          columns === 3 ? "lg:grid-cols-3" : "lg:grid-cols-4",
        )}
      >
        {venues.map((v, i) => (
          <li key={v.href} className="w-[78%] shrink-0 snap-start sm:w-[45%] md:w-auto">
            <Reveal delay={(i % columns) * 0.08} className="h-full">
              <VenueCard {...v} index={i} tone={tone} sizes={SIZES[columns]} />
            </Reveal>
          </li>
        ))}
      </ul>
    </div>
  );
}
