import Image from "next/image";
import Link from "next/link";
import type { Business } from "@/lib/content";
import { Reveal } from "@/components/effects/reveal";
import { StackingCards, StackingCardItem } from "@/components/effects/stacking-cards";
import { Tilt } from "@/components/effects/tilt";
import { TitleLines } from "@/components/page/title-lines";
import { titleParts } from "@/components/sections/business/title-parts";
import { pad2 } from "@/lib/utils";
import { SectionEyebrow } from "./section-eyebrow";

type Props = { businesses: Business[] };

/**
 * Four business cards that stack as the page scrolls (mobile and desktop).
 * Each card sits in a sticky slot (85svh on phones, 100svh on md+); later
 * cards stop a little lower so
 * the edges of the earlier ones peek out above, and earlier ones scale down.
 * Card height leaves room for the fixed header (h-16 / md:h-20) and the
 * deepest stack offset so nothing is clipped on a 390x664 viewport.
 */
export function Businesses({ businesses }: Props) {
  const total = businesses.length;
  return (
    <section data-testid="businesses" aria-labelledby="business-heading" className="relative bg-surface">
      <div className="mx-auto max-w-7xl px-5 pt-24 md:px-8 md:pt-36">
        <Reveal>
          <SectionEyebrow>BUSINESS</SectionEyebrow>
          <h2
            id="business-heading"
            className="mt-3 text-3xl font-bold tracking-[0.04em] text-ink md:mt-4 md:text-5xl"
          >
            事業紹介
          </h2>
        </Reveal>
      </div>

      <StackingCards
        totalCards={total}
        scaleMultiplier={0.04}
        // Bottom padding = how far the last card overhangs its slot (phones:
        // 7rem offset + (100svh - 8rem) card - 85svh slot = 15svh - 1rem) plus a
        // small gap, so the marquee follows the last card closely.
        className="mx-auto max-w-7xl px-5 pb-[calc(15svh+1rem)] md:px-8 md:pb-12"
      >
        {businesses.map((b, i) => (
          <StackingCardItem
            key={b.slug}
            index={i}
            topPosition={`calc(var(--stack-top) + ${i} * var(--stack-step))`}
            // Phones: a shorter scroll per card (85svh). Every slot must be the
            // same height, or shorter slots stay stuck longer than the last
            // one and their cards peek out below it as the stack leaves.
            className="h-[85svh] [--stack-step:0.75rem] [--stack-top:4.75rem] md:h-svh md:[--stack-step:1.25rem] md:[--stack-top:6.5rem]"
          >
            <BusinessCard business={b} index={i} />
          </StackingCardItem>
        ))}
      </StackingCards>
    </section>
  );
}

function BusinessCard({ business: b, index }: { business: Business; index: number }) {
  const no = pad2(index + 1);
  const title = b.brand ?? b.name;
  return (
    <article
      aria-labelledby={`business-${b.slug}`}
      className="flex h-[calc(100svh-8rem)] max-h-[40rem] flex-col overflow-hidden rounded-card border border-line bg-surface shadow-2xl shadow-brand-navy/10 md:h-[calc(100svh-11rem)] md:flex-row md:items-stretch"
    >
      <Tilt className="relative h-[47%] shrink-0 md:m-3 md:h-auto md:w-[46%] md:rounded-[calc(var(--radius-card)-0.25rem)]">
        <div className="relative h-full w-full overflow-hidden md:rounded-[calc(var(--radius-card)-0.25rem)]">
          {b.heroImage ? (
            <Image
              src={b.heroImage}
              alt=""
              fill
              sizes="(min-width: 1280px) 600px, (min-width: 768px) 46vw, 100vw"
              className="object-cover"
            />
          ) : (
            <div className="bg-brand-gradient absolute inset-0" />
          )}
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-t from-brand-navy/25 via-transparent to-transparent"
          />
        </div>
      </Tilt>

      <div className="flex min-h-0 flex-1 flex-col px-5 pt-5 pb-5 md:px-12 md:pt-12 md:pb-10 lg:px-14">
        <p className="font-display text-[0.7rem] font-medium tracking-[0.25em] text-brand-blue md:text-xs">
          {no} — {b.nameEn.toUpperCase()}
        </p>
        <h3
          id={`business-${b.slug}`}
          className="mt-2 break-keep text-[1.1875rem] leading-snug font-bold text-ink [overflow-wrap:break-word] md:mt-5 md:text-3xl md:leading-tight md:tracking-[0.01em] lg:text-[2.125rem]"
        >
          <TitleLines parts={titleParts(title, b.titleDisplay)} />
        </h3>
        {b.brand ? (
          <p className="mt-1 text-xs text-ink-muted md:mt-3 md:text-sm">{b.name}</p>
        ) : null}
        <p className="mt-3 text-sm leading-relaxed text-ink-muted [word-break:auto-phrase] md:mt-7 md:max-w-md md:text-lg md:leading-loose">
          {b.summary}
        </p>

        <div className="mt-auto flex items-end justify-between gap-4 pt-4">
          <Link
            href={`/business/${b.slug}`}
            className="group inline-flex items-center gap-3 rounded-full text-sm font-medium text-brand-blue focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-blue md:text-base"
            aria-label={`${title}を詳しく見る`}
          >
            <span className="border-b border-brand-blue/30 pb-1 transition-colors group-hover:border-brand-blue">
              詳しく見る
            </span>
            <span
              aria-hidden="true"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-brand-blue text-surface transition-transform duration-hover group-hover:translate-x-1 md:h-12 md:w-12"
            >
              →
            </span>
          </Link>
          <span
            aria-hidden="true"
            className="-mb-2 font-display text-[4.5rem] leading-none font-bold text-transparent [-webkit-text-stroke:1px_var(--color-brand-sky)] md:-mb-3 md:text-[9rem]"
          >
            {no}
          </span>
        </div>
      </div>
    </article>
  );
}

export default Businesses;
