"use client";

import { useRef } from "react";
import { motion, useTransform, type MotionValue } from "motion/react";
import { useGated, useMotionActive } from "@/lib/effects/hooks";
import { useStableScroll } from "@/lib/effects/stable-scroll";
import { cn, pad2 } from "@/lib/utils";
import { BusinessPhoto, BusinessTitle, DetailLink, SectionHeading, StaticBusinessList } from "./shared";
import { useActiveIndex, useScrollToProgress } from "./hooks";
import { clamp01, progressForStep, stepPosition } from "./progress";
import type { LabBusiness } from "./types";

type Props = { businesses: LabBusiness[] };

/** Plateau per business, relative to one transition (see stepPosition). */
const HOLD = 0.7;

/**
 * C. Split sticky. A tall section pins a 100svh stage.
 * - md+: the left column holds the text of the current business (crossfading
 *   and sliding between businesses) under an oversized number that rolls
 *   like an odometer; the right column stacks the photos, each new one
 *   wiping up from the bottom edge (clip-path inset) over the previous one.
 * - Phones: the photo stack fills the upper part of the stage and the text
 *   crossfades below it.
 * Step dots jump to each business.
 *
 * Reduced motion: the pinned stage is hidden and a static list is shown.
 */
export function VariantCSplit({ businesses }: Props) {
  const count = businesses.length;
  const sectionRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const active = useMotionActive();
  const raw = useStableScroll(sectionRef, ["start start", "end end"]);
  const progress = useGated(raw, active, 0);
  const position = useTransform(() => stepPosition(progress.get(), count, HOLD));
  const index = useActiveIndex(position, count);
  const scrollToProgress = useScrollToProgress(sectionRef, stageRef);
  const numberY = useTransform(() => `${-position.get()}em`);

  const dots = (
    <ol className="flex items-center gap-2.5" aria-label="事業を選ぶ">
      {businesses.map((b, i) => (
        <li key={b.slug}>
          <button
            type="button"
            onClick={() => scrollToProgress(progressForStep(i, count, HOLD))}
            aria-label={`${pad2(i + 1)} ${b.title}`}
            aria-current={i === index ? "step" : undefined}
            className="group flex h-11 w-11 items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-brand-blue md:h-9 md:w-9"
          >
            <span
              aria-hidden="true"
              className={cn(
                "block h-2.5 w-2.5 rounded-full border transition-transform duration-hover",
                i === index ? "scale-125 border-brand-blue bg-brand-blue" : "border-ink-muted/60 bg-transparent group-hover:border-brand-blue",
              )}
            />
          </button>
        </li>
      ))}
    </ol>
  );

  return (
    <section data-testid="lab-variant-c" aria-labelledby="lab-c-heading" className="relative bg-surface">
      <SectionHeading id="lab-c-heading" className="mx-auto max-w-7xl px-5 pt-24 md:px-8 md:pt-36" />

      <div ref={sectionRef} data-testid="lab-c-track" style={{ height: `${count * 100}svh` }} className="relative mt-6 motion-reduce:hidden md:mt-10">
        <div
          ref={stageRef}
          className="sticky top-0 h-svh overflow-hidden pt-[calc(4rem+var(--lab-bar,0px))] md:pt-[calc(5rem+var(--lab-bar,0px))]"
        >
          <div className="mx-auto flex h-full max-w-7xl flex-col px-5 pt-3 pb-4 md:grid md:grid-cols-12 md:items-center md:gap-12 md:px-8 md:py-10">
            {/* Photo stack: top on phones, right column on md+. */}
            <div className="relative h-[40svh] shrink-0 overflow-hidden rounded-card bg-brand-navy md:order-2 md:col-span-7 md:h-full md:max-h-[44rem]">
              {businesses.map((b, i) => (
                <StackPhoto key={b.slug} business={b} index={i} position={position} />
              ))}
              <p className="absolute bottom-3 left-4 font-display text-xs font-medium tracking-[0.25em] text-surface md:hidden">
                {pad2(index + 1)} / {pad2(count)}
              </p>
            </div>

            {/* Text column. */}
            <div className="relative flex min-h-0 flex-1 flex-col md:order-1 md:col-span-5 md:h-full md:max-h-[44rem] md:justify-center">
              <div
                aria-hidden="true"
                className="hidden h-[1em] overflow-hidden font-display text-[9rem] leading-none font-bold text-transparent [-webkit-text-stroke:1.5px_var(--color-brand-sky)] md:block lg:text-[11rem]"
              >
                <motion.div style={{ y: numberY }}>
                  {businesses.map((b, i) => (
                    <div key={b.slug} className="h-[1em]">
                      {pad2(i + 1)}
                    </div>
                  ))}
                </motion.div>
              </div>

              <div className="relative mt-5 min-h-0 flex-1 md:mt-8 md:flex-none md:basis-[20rem]">
                {businesses.map((b, i) => (
                  <StepText key={b.slug} business={b} index={i} position={position} current={i === index} />
                ))}
              </div>

              <div className="-ml-3 md:mt-6">{dots}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="hidden motion-reduce:block">
        <StaticBusinessList businesses={businesses} idPrefix="lab-c-static" />
      </div>
    </section>
  );
}

function StackPhoto({
  business,
  index,
  position,
}: {
  business: LabBusiness;
  index: number;
  position: MotionValue<number>;
}) {
  // 0 → 1 while this photo wipes in over the previous one (the first is always in).
  const reveal = useTransform(() => (index === 0 ? 1 : clamp01(position.get() - (index - 1))));
  // 0 → 1 while the next photo covers this one.
  const cover = useTransform(() => clamp01(position.get() - index));
  const clipPath = useTransform(() => `inset(${(1 - reveal.get()) * 100}% 0% 0% 0%)`);
  const scale = useTransform(() => 1.18 - 0.18 * reveal.get());
  const y = useTransform(() => `${-cover.get() * 12}%`);

  return (
    <motion.div aria-hidden="true" className="absolute inset-0 overflow-hidden" style={{ clipPath, zIndex: index }}>
      <motion.div className="absolute inset-0 will-change-transform" style={{ scale, y }}>
        <BusinessPhoto business={business} sizes="(min-width: 1280px) 720px, (min-width: 768px) 58vw, 100vw" />
      </motion.div>
      <div className="absolute inset-0 bg-linear-to-t from-brand-navy/45 via-transparent to-transparent md:from-brand-navy/20" />
    </motion.div>
  );
}

function StepText({
  business: b,
  index,
  position,
  current,
}: {
  business: LabBusiness;
  index: number;
  position: MotionValue<number>;
  current: boolean;
}) {
  const distance = useTransform(() => index - position.get());
  const opacity = useTransform(() => 1 - clamp01(Math.abs(distance.get()) * 1.6));
  const y = useTransform(() => `${Math.max(-1, Math.min(1, distance.get())) * 3}rem`);

  return (
    <motion.article
      aria-labelledby={`lab-c-${b.slug}`}
      aria-hidden={!current}
      inert={!current}
      className="absolute inset-0 flex flex-col"
      style={{ opacity, y }}
    >
      <p className="font-display text-[0.7rem] font-medium tracking-[0.25em] text-brand-blue md:text-xs">
        {pad2(index + 1)} — {b.nameEn.toUpperCase()}
      </p>
      <h3
        id={`lab-c-${b.slug}`}
        className="mt-2 text-[1.3125rem] leading-snug font-bold text-ink md:mt-4 md:text-4xl md:leading-tight"
      >
        <BusinessTitle business={b} />
      </h3>
      {b.subName ? <p className="mt-1 text-xs text-ink-muted md:mt-2 md:text-sm">{b.subName}</p> : null}
      <p className="mt-3 text-sm leading-relaxed text-ink-muted [word-break:auto-phrase] md:mt-5 md:text-base md:leading-loose">
        {b.summary}
      </p>
      <DetailLink business={b} className="mt-auto pt-3 md:mt-7 md:pt-0" />
    </motion.article>
  );
}

export default VariantCSplit;
