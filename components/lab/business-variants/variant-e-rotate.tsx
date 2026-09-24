"use client";

import { useEffect, useRef } from "react";
import { motion, useMotionValue, useTransform, type MotionValue } from "motion/react";
import { useGated, useMediaQuery, useMotionActive } from "@/lib/effects/hooks";
import { useStableScroll } from "@/lib/effects/stable-scroll";
import { cn, pad2 } from "@/lib/utils";
import { BusinessPhoto, BusinessTitle, DetailLink, SectionHeading, StaticBusinessList } from "./shared";
import { useActiveIndex, useScrollToProgress } from "./hooks";
import { clamp01, progressForStep, stepPosition } from "./progress";
import type { LabBusiness } from "./types";

type Props = { businesses: LabBusiness[] };

/** Plateau per business, relative to one turn (see stepPosition). */
const HOLD = 0.6;
/** Coverflow (phones): yaw of a neighbour card, in degrees. */
const FLOW_YAW = 32;

/**
 * E. 3D rotation. A tall section pins a 100svh stage holding the cards in
 * 3D (CSS perspective, transforms only).
 * - md+: the four cards are the faces of a prism turning around its vertical
 *   axis (90° per business); scrolling turns the next face to the front.
 * - Phones: a gentler coverflow — neighbours sit to the sides, turned
 *   {FLOW_YAW}° and pushed back — so the front card stays readable.
 * Cards away from the front are dimmed (a navy veil fading in); a list of
 * the businesses (md+) and dots (phones) show and jump to the current one.
 *
 * Reduced motion: the pinned stage is hidden and a static list is shown.
 */
export function VariantERotate({ businesses }: Props) {
  const count = businesses.length;
  const sectionRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const active = useMotionActive();
  const raw = useStableScroll(sectionRef, ["start start", "end end"]);
  const progress = useGated(raw, active, 0);
  const position = useTransform(() => stepPosition(progress.get(), count, HOLD));
  const index = useActiveIndex(position, count);
  const scrollToProgress = useScrollToProgress(sectionRef, stageRef);

  // Layout mode as a motion value, so the card transforms can read it.
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const desktop = useMotionValue(0);
  useEffect(() => {
    desktop.set(isDesktop ? 1 : 0);
  }, [desktop, isDesktop]);

  const jump = (i: number) => scrollToProgress(progressForStep(i, count, HOLD));

  return (
    <section data-testid="lab-variant-e" aria-labelledby="lab-e-heading" className="relative bg-surface-muted">
      <div ref={sectionRef} style={{ height: `${count * 100}svh` }} className="relative motion-reduce:hidden">
        <div
          ref={stageRef}
          className="sticky top-0 h-svh overflow-hidden pt-[calc(4rem+var(--lab-bar,0px))] md:pt-[calc(5rem+var(--lab-bar,0px))]"
        >
          <div className="mx-auto flex h-full max-w-7xl flex-col px-5 pt-4 pb-5 md:grid md:grid-cols-12 md:items-center md:gap-10 md:px-8 md:py-10">
            <div className="md:col-span-4">
              <SectionHeading id="lab-e-heading" />
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
              <div className="absolute inset-0 flex items-center justify-center [perspective:1400px] md:[perspective:2200px]">
                {businesses.map((b, i) => (
                  <Card
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

      <div className="hidden motion-reduce:block">
        <SectionHeading id="lab-e-heading-static" className="mx-auto max-w-7xl px-5 pt-24 md:px-8 md:pt-36" />
        <StaticBusinessList businesses={businesses} idPrefix="lab-e-static" />
      </div>
    </section>
  );
}

function Card({
  business: b,
  index,
  position,
  desktop,
  current,
}: {
  business: LabBusiness;
  index: number;
  position: MotionValue<number>;
  desktop: MotionValue<number>;
  current: boolean;
}) {
  // Signed distance from the front, in cards.
  const transform = useTransform(() => {
    const d = index - position.get();
    const isDesktop = desktop.get();
    if (isDesktop) {
      // Prism: every face is --half (half the card width) from the axis.
      return `translateZ(calc(-1 * var(--half))) rotateY(${d * 90}deg) translateZ(var(--half))`;
    }
    const clamped = Math.max(-2, Math.min(2, d));
    const yaw = -Math.max(-1, Math.min(1, clamped)) * FLOW_YAW;
    return `translateX(${clamped * 72}%) translateZ(${-Math.abs(clamped) * 220}px) rotateY(${yaw}deg)`;
  });
  // Hide cards that are behind (prism) or far out (coverflow).
  const opacity = useTransform(() => 1 - clamp01(Math.abs(index - position.get()) - 1.2));
  const veil = useTransform(() => clamp01(Math.abs(index - position.get())) * 0.45);
  // Nearer cards paint on top (siblings are flat-composited, not depth-sorted).
  const zIndex = useTransform(() => 10 - Math.round(Math.abs(index - position.get()) * 2));

  return (
    <motion.article
      aria-labelledby={`lab-e-${b.slug}`}
      aria-hidden={!current}
      inert={!current}
      className="absolute flex h-[min(96%,34rem)] w-[72%] flex-col overflow-hidden rounded-card border border-line bg-surface shadow-2xl shadow-brand-navy/15 [--card-w:min(40vw,34rem)] [--half:calc(var(--card-w)/2)] [backface-visibility:hidden] md:h-[88%] md:w-[var(--card-w)]"
      style={{ transform, opacity, zIndex }}
    >
      <div className="relative h-[52%] shrink-0 overflow-hidden">
        <BusinessPhoto business={b} sizes="(min-width: 1280px) 544px, (min-width: 768px) 40vw, 72vw" />
      </div>
      <div className="flex min-h-0 flex-1 flex-col p-4 md:p-7">
        <p className="font-display text-[0.65rem] font-medium tracking-[0.25em] text-brand-blue md:text-xs">
          {pad2(index + 1)} — {b.nameEn.toUpperCase()}
        </p>
        <h3
          id={`lab-e-${b.slug}`}
          className="mt-1.5 text-lg leading-snug font-bold text-ink md:mt-3 md:text-2xl"
        >
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

export default VariantERotate;
