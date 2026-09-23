import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn, pad2 } from "@/lib/utils";

export type VenueCardProps = {
  href: string;
  name: string;
  /** Small label above the name (e.g. the venue's category). */
  category?: string;
  catchcopy: string;
  /** Photo URL. Without one, a brand-gradient "写真準備中" placeholder is shown. */
  image?: string;
  /** 0-based position; shown as the "01" badge. */
  index: number;
  /** "onDark" on navy sections (no border, sky focus ring). */
  tone?: "default" | "onDark";
  /** Latin label on the placeholder. */
  placeholderLabel?: string;
  /** next/image `sizes` for the photo. */
  sizes?: string;
  /** Externally highlighted (e.g. synced with a map pin). */
  highlighted?: boolean;
  /**
   * Called on mouse hover / keyboard focus in (true) and out (false). Only
   * pass from client components (the handlers are attached only when set).
   */
  onHighlightChange?: (on: boolean) => void;
};

/**
 * Photo card linking to a venue page: photo (or placeholder) with an index
 * badge, name, catchcopy and a "詳しく見る" cue. Hover zooms the photo on
 * pointer devices; on touch a press-scale gives feedback instead.
 */
export function VenueCard({
  href,
  name,
  category,
  catchcopy,
  image,
  index,
  tone = "default",
  placeholderLabel = "YUEI JAPAN",
  sizes = "(min-width: 768px) 25vw, 78vw",
  highlighted = false,
  onHighlightChange,
}: VenueCardProps) {
  const dark = tone === "onDark";
  const handlers = onHighlightChange
    ? {
        onPointerEnter: (e: React.PointerEvent) => e.pointerType === "mouse" && onHighlightChange(true),
        onPointerLeave: (e: React.PointerEvent) => e.pointerType === "mouse" && onHighlightChange(false),
        onFocus: () => onHighlightChange(true),
        onBlur: () => onHighlightChange(false),
      }
    : {};

  return (
    <Link
      href={href}
      {...handlers}
      className={cn(
        "group flex h-full flex-col overflow-hidden rounded-card bg-surface text-ink ring-2 ring-transparent transition-[box-shadow,transform] duration-hover active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-4 md:active:scale-100",
        dark ? "focus-visible:outline-brand-sky" : "border border-line focus-visible:outline-brand-blue md:hover:-translate-y-1 md:hover:shadow-lg",
        highlighted && (dark ? "ring-brand-sky md:-translate-y-1" : "ring-brand-blue/40 md:-translate-y-1"),
      )}
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        {image ? (
          <Image
            src={image}
            alt=""
            fill
            sizes={sizes}
            className="object-cover transition-transform duration-reveal group-hover:scale-105"
          />
        ) : (
          <div
            aria-hidden
            className="bg-brand-gradient absolute inset-0 flex flex-col items-center justify-center gap-2 text-surface"
          >
            <span className="font-display text-[0.625rem] tracking-[0.3em] text-brand-sky">{placeholderLabel}</span>
            <span className="text-sm font-bold tracking-[0.15em]">写真準備中</span>
          </div>
        )}
        <span
          aria-hidden
          className="absolute left-3 top-3 rounded-full bg-brand-navy/85 px-2.5 py-1 font-display text-[0.6875rem] tracking-[0.15em] text-brand-sky"
        >
          {pad2(index + 1)}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-5">
        {category && <p className="mb-1.5 text-[0.6875rem] font-bold tracking-[0.15em] text-brand-blue">{category}</p>}
        <p className="text-lg font-bold">{name}</p>
        <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-muted [word-break:auto-phrase]">{catchcopy}</p>
        <p className="mt-5 inline-flex items-center gap-2 text-xs font-bold tracking-[0.1em] text-brand-blue">
          詳しく見る
          <ArrowRight aria-hidden className="size-3.5 transition-transform duration-hover ease-brand-out group-hover:translate-x-1" />
        </p>
      </div>
    </Link>
  );
}
