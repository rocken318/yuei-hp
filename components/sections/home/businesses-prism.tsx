"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useMotionValue, useMotionValueEvent, useTransform, type MotionValue } from "motion/react";
import { useLenis } from "lenis/react";
import { Reveal } from "@/components/effects/reveal";
import { TitleLines } from "@/components/page/title-lines";
import { useGated, useMediaQuery, useMotionActive } from "@/lib/effects/hooks";
import { useStableScroll } from "@/lib/effects/stable-scroll";
import { cn, pad2 } from "@/lib/utils";
import { SectionEyebrow } from "./section-eyebrow";
import {
  activeIndex,
  clamp01,
  prismFace,
  prismTurn,
  progressForStep,
  stepPosition,
  type PrismBusiness,
} from "./businesses-prism-model";

type Props = { businesses: PrismBusiness[] };

/** Plateau per business, relative to one turn (see stepPosition). */
const HOLD = 0.6;
/** Veil over a face turned edge-on: md+ / phones. */
const VEIL = 0.45;
const PHONE_VEIL = 0.38;
/**
 * Phones: extra pull-back half-way through a turn, relative to the prism's
 * half-depth. Keeps the 45° pose inside the screen width.
 */
const PHONE_DOLLY = 0.5;

/**
 * Business section: a four-sided prism turning with scroll.
 *
 * A tall section (100svh per business) pins a 100svh stage below the fixed
 * header. The business cards are the faces of a prism turning around its
 * vertical axis (90° per business, CSS perspective, transforms and opacity
 * only); each face holds square to the viewer for a while before the next
 * one turns in. Faces turning away are dimmed by a navy veil.
 * - md+: heading and a list of the businesses (jumps to one) on the left,
 *   the prism (faces min(40vw, 34rem) wide, perspective 2200px) on the right.
 * - Phones: heading with a "01 / 04" counter, the prism with 80vw faces
 *   (perspective 1000px, backing off a little mid-turn so the 45° pose stays
 *   on screen) and dots that jump to each business.
 *
 * Reduced motion: the pinned stage is hidden and a static list is shown.
 */
export function BusinessesPrism({ businesses }: Props) {
  const count = businesses.length;
  const sectionRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const active = useMotionActive();
  const raw = useStableScroll(sectionRef, ["start start", "end end"]);
  const progress = useGated(raw, active, 0);
  const position = useTransform(() => stepPosition(progress.get(), count, HOLD));
  const index = useActiveIndex(position, count);
  const scrollToProgress = useScrollToProgress(sectionRef, stageRef);
  const jump = (i: number) => scrollToProgress(progressForStep(i, count, HOLD));

  // Layout mode as a motion value, so the face transforms can read it.
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const desktop = useMotionValue(0);
  useEffect(() => {
    desktop.set(isDesktop ? 1 : 0);
  }, [desktop, isDesktop]);

  return (
    <section data-testid="businesses" aria-labelledby="business-heading" className="relative bg-surface">
      <div ref={sectionRef} style={{ height: `${count * 100}svh` }} className="relative motion-reduce:hidden">
        <div ref={stageRef} data-testid="businesses-stage" className="sticky top-0 h-svh overflow-hidden pt-16 md:pt-20">
          <div className="mx-auto flex h-full max-w-7xl flex-col px-5 pt-4 pb-5 md:grid md:grid-cols-12 md:items-center md:gap-10 md:px-8 md:py-10">
            <div className="flex items-end justify-between md:col-span-4 md:block">
              <SectionHeading id="business-heading" />
              <p className="pb-1 font-display text-sm tracking-[0.2em] text-ink-muted md:hidden" aria-hidden="true">
                <span className="text-brand-blue">{pad2(index + 1)}</span> / {pad2(count)}
              </p>
              <ol className="mt-10 hidden space-y-1 md:block" aria-label="事業を選ぶ">
                {businesses.map((b, i) => (
                  <li key={b.slug}>
                    <button
                      type="button"
                      onClick={() => jump(i)}
                      aria-current={i === index ? "step" : undefined}
                      className={cn(
                        "flex w-full items-baseline gap-4 rounded-md py-2 text-left transition-colors duration-hover focus-visible:outline-2 focus-visible:outline-brand-blue",
                        i === index ? "text-ink" : "text-ink-muted hover:text-ink",
                      )}
                    >
                      <span className={cn("font-display text-xs tracking-[0.2em]", i === index && "text-brand-blue")}>
                        {pad2(i + 1)}
                      </span>
                      <span className="font-heading text-base font-bold lg:text-lg">{b.title}</span>
                    </button>
                  </li>
                ))}
              </ol>
            </div>

            <div className="relative mt-5 min-h-0 flex-1 md:col-span-8 md:mt-0 md:h-full md:max-h-[42rem]">
              <div
                data-testid="businesses-prism"
                className="absolute inset-0 flex items-center justify-center [perspective:1000px] md:[perspective:2200px]"
              >
                {businesses.map((b, i) => (
                  <Face
                    key={b.slug}
                    business={b}
                    index={i}
                    position={position}
                    desktop={desktop}
                    current={i === index}
                  />
                ))}
              </div>
            </div>

            <ol className="-mb-2 flex shrink-0 items-center justify-center gap-1 md:hidden" aria-label="事業を選ぶ">
              {businesses.map((b, i) => (
                <li key={b.slug}>
                  <button
                    type="button"
                    onClick={() => jump(i)}
                    aria-label={`${pad2(i + 1)} ${b.title}`}
                    aria-current={i === index ? "step" : undefined}
                    className="flex h-11 w-11 items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-brand-blue"
                  >
                    <span
                      aria-hidden="true"
                      className={cn(
                        "block h-2 rounded-full transition-[width,background-color] duration-hover",
                        i === index ? "w-6 bg-brand-blue" : "w-2 bg-ink-muted/40",
                      )}
                    />
                  </button>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>

      {/* Reduced motion: nothing pinned or moving. */}
      <div className="hidden motion-reduce:block">
        <SectionHeading id="business-heading-static" className="mx-auto max-w-7xl px-5 pt-24 md:px-8 md:pt-36" />
        <StaticList businesses={businesses} />
      </div>
    </section>
  );
}

function Face({
  business: b,
  index,
  position,
  desktop,
  current,
}: {
  business: PrismBusiness;
  index: number;
  position: MotionValue<number>;
  /** 1 on md+, 0 on phones. */
  desktop: MotionValue<number>;
  current: boolean;
}) {
  const transform = useTransform(() => {
    // Signed distance from the front, in faces.
    const d = index - position.get();
    // Every face is --half (half the face width) from the axis; phones back
    // off a little mid-turn.
    const dolly = desktop.get() ? 0 : PHONE_DOLLY;
    const back = 1 + dolly * prismTurn(position.get());
    return `translateZ(calc(-${back} * var(--half))) rotateY(${prismFace(d).yaw}deg) translateZ(var(--half))`;
  });
  // Faces behind the prism are hidden.
  const opacity = useTransform(() => prismFace(index - position.get()).opacity);
  const veil = useTransform(() => prismFace(index - position.get(), desktop.get() ? VEIL : PHONE_VEIL).veil);
  // Nearer faces paint on top (siblings are flat-composited, not depth-sorted).
  const zIndex = useTransform(() => 10 - Math.round(Math.abs(index - position.get()) * 2));

  return (
    <motion.article
      aria-labelledby={`business-${b.slug}`}
      aria-hidden={!current}
      inert={!current}
      className="absolute flex h-[min(92%,34rem)] w-[var(--card-w)] flex-col overflow-hidden rounded-card border border-line bg-surface shadow-2xl shadow-brand-navy/15 [--card-w:80vw] [--half:calc(var(--card-w)/2)] [backface-visibility:hidden] md:h-[88%] md:[--card-w:min(40vw,34rem)]"
      style={{ transform, opacity, zIndex }}
    >
      <div className="relative h-[50%] shrink-0 overflow-hidden md:h-[52%]">
        <BusinessPhoto business={b} sizes="(min-width: 1280px) 544px, (min-width: 768px) 40vw, 80vw" />
      </div>
      <div className="flex min-h-0 flex-1 flex-col p-4 md:p-7">
        <p className="font-display text-[0.65rem] font-medium tracking-[0.25em] text-brand-blue md:text-xs">
          {pad2(index + 1)} — {b.nameEn.toUpperCase()}
        </p>
        <h3 id={`business-${b.slug}`} className="mt-1.5 text-lg leading-snug font-bold text-ink md:mt-3 md:text-2xl">
          <BusinessTitle business={b} />
        </h3>
        <p className="mt-2 line-clamp-3 text-[0.8125rem] leading-relaxed text-ink-muted [word-break:auto-phrase] md:mt-3 md:text-sm md:leading-loose">
          {b.lead ?? b.summary}
        </p>
        <DetailLink business={b} className="mt-auto pt-3" />
      </div>
      <motion.div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-brand-navy" style={{ opacity: veil }} />
    </motion.article>
  );
}

/** Reduced motion: alternating photo / text rows. */
function StaticList({ businesses }: Props) {
  return (
    <ol className="mx-auto mt-10 grid max-w-7xl gap-14 px-5 pb-24 md:mt-16 md:gap-24 md:px-8 md:pb-36">
      {businesses.map((b, i) => (
        <li key={b.slug}>
          <article
            aria-labelledby={`business-static-${b.slug}`}
            className="grid items-center gap-6 md:grid-cols-2 md:gap-14"
          >
            <div className={cn("relative aspect-[4/3] overflow-hidden rounded-card", i % 2 === 1 && "md:order-2")}>
              <BusinessPhoto business={b} sizes="(min-width: 1280px) 620px, (min-width: 768px) 50vw, 100vw" />
            </div>
            <div>
              <p className="font-display text-xs font-medium tracking-[0.25em] text-brand-blue">
                {pad2(i + 1)} — {b.nameEn.toUpperCase()}
              </p>
              <h3 id={`business-static-${b.slug}`} className="mt-3 text-2xl leading-snug font-bold text-ink md:text-4xl">
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

/** "BUSINESS / 事業紹介" heading. */
function SectionHeading({ id, className }: { id: string; className?: string }) {
  return (
    <Reveal className={className}>
      <SectionEyebrow>BUSINESS</SectionEyebrow>
      <h2 id={id} className="mt-3 text-3xl font-bold tracking-[0.04em] text-ink md:mt-4 md:text-5xl">
        事業紹介
      </h2>
    </Reveal>
  );
}

/** "詳しく見る →" link to the business page. */
function DetailLink({ business: b, className }: { business: PrismBusiness; className?: string }) {
  return (
    <Link
      href={b.href}
      aria-label={`${b.title}を詳しく見る`}
      className={cn(
        "group inline-flex items-center gap-3 rounded-full text-sm font-medium text-brand-blue focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-blue md:text-base",
        className,
      )}
    >
      <span className="border-b border-brand-blue/30 pb-1 transition-colors duration-hover group-hover:border-brand-blue">
        詳しく見る
      </span>
      <span
        aria-hidden="true"
        className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-brand-blue text-surface transition-transform duration-hover group-hover:translate-x-1 md:h-11 md:w-11"
      >
        →
      </span>
    </Link>
  );
}

/** Business title (brand ?? name) broken only between its parts. */
function BusinessTitle({ business: b }: { business: PrismBusiness }) {
  return (
    <span className="break-keep [overflow-wrap:break-word]">
      <TitleLines parts={b.titleParts} />
    </span>
  );
}

/** Photo, or the brand gradient when a business has none. */
function BusinessPhoto({ business: b, sizes }: { business: PrismBusiness; sizes: string }) {
  return b.heroImage ? (
    <Image src={b.heroImage} alt="" fill sizes={sizes} className="object-cover" />
  ) : (
    <div className="bg-brand-gradient absolute inset-0" />
  );
}

/**
 * The item nearest to a continuous position, as React state: re-renders only
 * when the index changes (counter, dots, which face is interactive).
 */
function useActiveIndex(position: MotionValue<number>, count: number): number {
  const [index, setIndex] = useState(() => activeIndex(position.get(), count));
  useMotionValueEvent(position, "change", (v) => {
    const next = activeIndex(v, count);
    setIndex((prev) => (prev === next ? prev : next));
  });
  return index;
}

/**
 * Scrolls the window so that the pinned section (`section`, holding the
 * sticky 100svh `stage`) sits at `progress` of its ["start start", "end end"]
 * range. Smooth through Lenis when it runs, native otherwise (instant under
 * reduced motion, where Lenis is off and the global CSS drops smooth scroll).
 */
function useScrollToProgress(section: RefObject<HTMLElement | null>, stage: RefObject<HTMLElement | null>) {
  const lenis = useLenis();
  return (progress: number) => {
    const el = section.current;
    const pinned = stage.current;
    if (!el || !pinned) return;
    const top = el.getBoundingClientRect().top + window.scrollY;
    // The stage is h-svh: its height is the stable viewport height.
    const y = top + clamp01(progress) * (el.offsetHeight - pinned.offsetHeight);
    if (lenis) lenis.scrollTo(y);
    else window.scrollTo({ top: y, behavior: "smooth" });
  };
}

export default BusinessesPrism;
