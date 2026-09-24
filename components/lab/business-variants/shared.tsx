import Image from "next/image";
import Link from "next/link";
import { SectionEyebrow } from "@/components/sections/home/section-eyebrow";
import { TitleLines } from "@/components/page/title-lines";
import { cn } from "@/lib/utils";
import { pad2 } from "@/lib/utils";
import type { LabBusiness } from "./types";

/** "BUSINESS / 事業紹介" heading, as on the home page. */
export function SectionHeading({
  id,
  tone = "default",
  className,
}: {
  id: string;
  tone?: "default" | "onDark";
  className?: string;
}) {
  return (
    <div className={className}>
      <SectionEyebrow tone={tone}>BUSINESS</SectionEyebrow>
      <h2
        id={id}
        className={cn(
          "mt-3 text-3xl font-bold tracking-[0.04em] md:mt-4 md:text-5xl",
          tone === "onDark" ? "text-surface" : "text-ink",
        )}
      >
        事業紹介
      </h2>
    </div>
  );
}

/** "詳しく見る →" link to the business page. */
export function DetailLink({
  business,
  tone = "default",
  className,
  tabIndex,
}: {
  business: LabBusiness;
  tone?: "default" | "onDark";
  className?: string;
  tabIndex?: number;
}) {
  const dark = tone === "onDark";
  return (
    <Link
      href={business.href}
      tabIndex={tabIndex}
      aria-label={`${business.title}を詳しく見る`}
      className={cn(
        "group inline-flex items-center gap-3 rounded-full text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-4 md:text-base",
        dark ? "text-surface focus-visible:outline-surface" : "text-brand-blue focus-visible:outline-brand-blue",
        className,
      )}
    >
      <span
        className={cn(
          "border-b pb-1 transition-colors duration-hover",
          dark ? "border-surface/40 group-hover:border-surface" : "border-brand-blue/30 group-hover:border-brand-blue",
        )}
      >
        詳しく見る
      </span>
      <span
        aria-hidden="true"
        className={cn(
          "inline-flex h-9 w-9 items-center justify-center rounded-full transition-transform duration-hover group-hover:translate-x-1 md:h-11 md:w-11",
          dark ? "bg-surface text-brand-navy" : "bg-brand-blue text-surface",
        )}
      >
        →
      </span>
    </Link>
  );
}

/** Business title (brand ?? name) broken only between its parts. */
export function BusinessTitle({ business, className }: { business: LabBusiness; className?: string }) {
  return (
    <span className={cn("break-keep [overflow-wrap:break-word]", className)}>
      <TitleLines parts={business.titleParts} />
    </span>
  );
}

/** Photo, or the brand gradient when a business has none. */
export function BusinessPhoto({
  business,
  sizes,
  className,
}: {
  business: LabBusiness;
  sizes: string;
  className?: string;
}) {
  return business.heroImage ? (
    <Image src={business.heroImage} alt="" fill sizes={sizes} className={cn("object-cover", className)} />
  ) : (
    <div className={cn("bg-brand-gradient absolute inset-0", className)} />
  );
}

/**
 * The static layout every animated variant falls back to under
 * prefers-reduced-motion: alternating photo / text rows, nothing pinned or
 * moving. Rendered next to the animated layout and toggled with the
 * `motion-reduce:` variant, so the server markup is right for both.
 */
export function StaticBusinessList({ businesses, idPrefix }: { businesses: LabBusiness[]; idPrefix: string }) {
  return (
    <ol className="mx-auto mt-10 grid max-w-7xl gap-14 px-5 pb-24 md:mt-16 md:gap-24 md:px-8 md:pb-36">
      {businesses.map((b, i) => (
        <li key={b.slug}>
          <article
            aria-labelledby={`${idPrefix}-${b.slug}`}
            className="grid items-center gap-6 md:grid-cols-2 md:gap-14"
          >
            <div className={cn("relative aspect-[4/3] overflow-hidden rounded-card", i % 2 === 1 && "md:order-2")}>
              <BusinessPhoto business={b} sizes="(min-width: 1280px) 620px, (min-width: 768px) 50vw, 100vw" />
            </div>
            <div>
              <p className="font-display text-xs font-medium tracking-[0.25em] text-brand-blue">
                {pad2(i + 1)} — {b.nameEn.toUpperCase()}
              </p>
              <h3 id={`${idPrefix}-${b.slug}`} className="mt-3 text-2xl leading-snug font-bold text-ink md:text-4xl">
                <BusinessTitle business={b} />
              </h3>
              {b.subName ? <p className="mt-2 text-sm text-ink-muted">{b.subName}</p> : null}
              <p className="mt-4 text-sm leading-relaxed text-ink-muted [word-break:auto-phrase] md:text-base md:leading-loose">
                {b.summary}
              </p>
              <DetailLink business={b} className="mt-6" />
            </div>
          </article>
        </li>
      ))}
    </ol>
  );
}
