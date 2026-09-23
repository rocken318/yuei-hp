import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Business } from "@/lib/content";
import { Reveal } from "@/components/effects/reveal";
import { Tilt } from "@/components/effects/tilt";
import { cn, pad2 } from "@/lib/utils";
import { TitleLines } from "@/components/page/title-lines";
import { titleParts } from "./title-parts";

type Props = {
  business: Business;
  /** 0-based position: sets the "01" number and the side the photo sits on. */
  index: number;
  /** Short tags under the copy (venue names, or service titles for digital). */
  tags?: string[];
};

/**
 * One business on the /business index: a large tilting photo beside the copy.
 * From md the photo alternates sides (even rows left, odd rows right); on
 * phones the photo stacks above the copy. The whole row reveals on scroll,
 * the copy a beat after the photo. Hover effects (photo zoom, arrow nudge)
 * only apply on hover-capable pointers (Tailwind v4 hover); on touch the
 * photo and the arrow button give press feedback instead.
 */
export function BusinessRow({ business: b, index, tags = [] }: Props) {
  const no = pad2(index + 1);
  const title = b.brand ?? b.name;
  const flipped = index % 2 === 1;
  const headingId = `business-${b.slug}`;

  return (
    <article
      aria-labelledby={headingId}
      data-testid="business-row"
      className="grid grid-cols-1 items-center gap-8 md:grid-cols-12 md:gap-10 lg:gap-16"
    >
      <Reveal className={cn("md:col-span-7", flipped && "md:order-2")}>
        <Link
          href={`/business/${b.slug}`}
          tabIndex={-1}
          aria-hidden
          className="group block rounded-card transition-transform duration-hover ease-brand-out active:scale-[0.98] md:active:scale-100"
        >
          <Tilt maxTilt={4} className="rounded-card">
            <div className="relative aspect-[4/3] overflow-hidden rounded-card bg-surface-muted md:aspect-[5/4] lg:aspect-[4/3]">
              {b.heroImage ? (
                <Image
                  src={b.heroImage}
                  alt=""
                  fill
                  sizes="(min-width: 1280px) 44rem, (min-width: 768px) 58vw, calc(100vw - 2.5rem)"
                  className="object-cover transition-transform duration-reveal group-hover:scale-105"
                />
              ) : (
                <div className="bg-brand-gradient absolute inset-0" />
              )}
              <div aria-hidden className="absolute inset-0 bg-linear-to-t from-brand-navy/30 via-transparent to-transparent" />
              <span
                aria-hidden
                className="absolute bottom-4 left-5 font-display text-xs tracking-[0.3em] text-surface md:bottom-6 md:left-7"
              >
                {(b.brandEn ?? b.nameEn).toUpperCase()}
              </span>
            </div>
          </Tilt>
        </Link>
      </Reveal>

      <Reveal delay={0.12} className={cn("md:col-span-5", flipped && "md:order-1")}>
        <div className="relative">
          <span
            aria-hidden
            className="block font-display text-[4.5rem] font-bold leading-none text-transparent [-webkit-text-stroke:1px_var(--color-brand-blue)] md:text-[6.5rem]"
          >
            {no}
          </span>
          <p className="mt-5 flex items-center gap-3 font-display text-[0.7rem] font-medium tracking-[0.25em] text-brand-blue md:mt-7 md:text-xs">
            <span aria-hidden className="h-px w-8 bg-brand-blue/60" />
            {b.nameEn.toUpperCase()}
          </p>
          <h2
            id={headingId}
            className="relative mt-4 break-keep text-[1.625rem] font-bold leading-snug text-ink [overflow-wrap:break-word] md:text-xl lg:text-[2rem] lg:leading-tight"
          >
            <TitleLines parts={titleParts(title, b.titleDisplay)} />
          </h2>
          {b.brand && <p className="relative mt-2 text-sm text-ink-muted">{b.name}</p>}
          <p className="relative mt-5 text-base font-bold leading-relaxed text-brand-navy [word-break:auto-phrase] md:mt-7 md:text-lg">
            {b.lead ?? b.summary}
          </p>
          {b.lead && (
            <p className="relative mt-3 text-sm leading-[1.9] text-ink-muted [word-break:auto-phrase] md:text-base">
              {b.summary}
            </p>
          )}
          {tags.length > 0 && (
            <ul aria-label="主な内容" className="relative mt-6 flex flex-wrap gap-2">
              {tags.map((t) => (
                <li
                  key={t}
                  className="rounded-full border border-line bg-surface-muted px-3 py-1 text-xs text-ink-muted"
                >
                  {t}
                </li>
              ))}
            </ul>
          )}
          <Link
            href={`/business/${b.slug}`}
            aria-label={`${title}を詳しく見る`}
            className="group relative mt-8 inline-flex items-center gap-3 rounded-full text-sm font-bold text-brand-blue focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-blue md:mt-10 md:text-base"
          >
            <span className="border-b border-brand-blue/30 pb-1 transition-colors duration-hover group-hover:border-brand-blue">
              詳しく見る
            </span>
            <span
              aria-hidden
              className="inline-flex size-11 items-center justify-center rounded-full bg-brand-blue text-surface transition-transform duration-hover ease-brand-out group-hover:translate-x-1 group-active:scale-90 md:size-12"
            >
              <ArrowRight className="size-4" />
            </span>
          </Link>
        </div>
      </Reveal>
    </article>
  );
}
