"use client";

import { useEffect, useRef } from "react";
import { motion, useMotionValue, useTransform, type MotionValue } from "motion/react";
import { useGated, useMediaQuery, useMotionActive } from "@/lib/effects/hooks";
import { useStableScroll } from "@/lib/effects/stable-scroll";
import { cn, pad2 } from "@/lib/utils";
import { BusinessPhoto, BusinessTitle, DetailLink, SectionHeading, StaticBusinessList } from "./shared";
import { useActiveIndex, useScrollToProgress } from "./hooks";
import { clamp01, prismFace, prismTurn, progressForStep, stepPosition } from "./progress";
import type { LabBusiness } from "./types";

type Props = {
  businesses: LabBusiness[];
  /**
   * F ("E'"): use the prism on phones too, instead of the coverflow. The
   * phone prism has ~80vw faces, a shorter perspective and a lighter veil.
   */
  prismOnPhones?: boolean;
};

/** Plateau per business, relative to one turn (see stepPosition). */
const HOLD = 0.6;
/** Coverflow (phones): yaw of a neighbour card, in degrees. */
const FLOW_YAW = 32;
/** Veil over a face turned edge-on: desktop prism / phone prism (F). */
const PRISM_VEIL = 0.45;
const PHONE_PRISM_VEIL = 0.38;
/**
 * Phone prism (F): extra pull-back half-way through a turn, relative to the
 * prism's half-depth. Keeps the 45° pose inside the screen width.
 */
const PHONE_DOLLY = 0.5;

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
 * With `prismOnPhones` (lab variant F) phones get the prism too: faces
 * 80vw wide (so the prism is 40vw deep), perspective 1000px — short enough
 * for a clear turn, long enough that the side faces are not stretched — and
 * a "01 / 04" counter next to the heading; the prism also backs off a
 * little mid-turn ({PHONE_DOLLY}) so the 45° pose stays on screen.
 *
 * Reduced motion: the pinned stage is hidden and a static list is shown.
 */
export function VariantERotate({ businesses, prismOnPhones = false }: Props) {
  const id = prismOnPhones ? "f" : "e";
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
  const prism = isDesktop || prismOnPhones;
  const desktop = useMotionValue(0);
  useEffect(() => {
    desktop.set(prism ? 1 : 0);
  }, [desktop, prism]);
  const veilMax = isDesktop ? PRISM_VEIL : PHONE_PRISM_VEIL;
  const dolly = prismOnPhones && !isDesktop ? PHONE_DOLLY : 0;

  const jump = (i: number) => scrollToProgress(progressForStep(i, count, HOLD));

  return (
    <section data-testid={`lab-variant-${id}`} aria-labelledby={`lab-${id}-heading`} className="relative bg-surface-muted">
      <div ref={sectionRef} style={{ height: `${count * 100}svh` }} className="relative motion-reduce:hidden">
        <div
          ref={stageRef}
          className="sticky top-0 h-svh overflow-hidden pt-[calc(4rem+var(--lab-bar,0px))] md:pt-[calc(5rem+var(--lab-bar,0px))]"
        >
          <div className="mx-auto flex h-full max-w-7xl flex-col px-5 pt-4 pb-5 md:grid md:grid-cols-12 md:items-center md:gap-10 md:px-8 md:py-10">
            <div className="flex items-end justify-between md:col-span-4 md:block">
              <SectionHeading id={`lab-${id}-heading`} />
              {prismOnPhones ? (
                <p className="pb-1 font-display text-sm tracking-[0.2em] text-ink-muted md:hidden" aria-hidden="true">
                  <span className="text-brand-blue">{pad2(index + 1)}</span> / {pad2(count)}
                </p>
              ) : null}
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
                className={cn(
                  "absolute inset-0 flex items-center justify-center md:[perspective:2200px]",
                  prismOnPhones ? "[perspective:1000px]" : "[perspective:1400px]",
                )}
              >
                {businesses.map((b, i) => (
                  <Card
                    key={b.slug}
                    business={b}
                    index={i}
                    position={position}
                    desktop={desktop}
                    current={i === index}
                    idPrefix={`lab-${id}`}
                    phonePrism={prismOnPhones}
                    veilMax={veilMax}
                    dolly={dolly}
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
        <SectionHeading id={`lab-${id}-heading-static`} className="mx-auto max-w-7xl px-5 pt-24 md:px-8 md:pt-36" />
        <StaticBusinessList businesses={businesses} idPrefix={`lab-${id}-static`} />
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
  idPrefix,
  phonePrism,
  veilMax,
  dolly,
}: {
  business: LabBusiness;
  index: number;
  position: MotionValue<number>;
  /** 1: prism (md+, or phones in F); 0: coverflow. */
  desktop: MotionValue<number>;
  current: boolean;
  idPrefix: string;
  phonePrism: boolean;
  veilMax: number;
  /** Pull-back mid-turn, × half-depth (0: none). */
  dolly: number;
}) {
  // Signed distance from the front, in cards.
  const transform = useTransform(() => {
    const d = index - position.get();
    const isDesktop = desktop.get();
    if (isDesktop) {
      // Prism: every face is --half (half the card width) from the axis.
      const back = 1 + dolly * prismTurn(position.get());
      return `translateZ(calc(-${back} * var(--half))) rotateY(${prismFace(d).yaw}deg) translateZ(var(--half))`;
    }
    const clamped = Math.max(-2, Math.min(2, d));
    const yaw = -Math.max(-1, Math.min(1, clamped)) * FLOW_YAW;
    return `translateX(${clamped * 72}%) translateZ(${-Math.abs(clamped) * 220}px) rotateY(${yaw}deg)`;
  });
  // Hide cards that are behind (prism) or far out (coverflow).
  const opacity = useTransform(() => 1 - clamp01(Math.abs(index - position.get()) - 1.2));
  const veil = useTransform(() => {
    const d = index - position.get();
    return desktop.get() ? prismFace(d, veilMax).veil : clamp01(Math.abs(d)) * PRISM_VEIL;
  });
  // Nearer cards paint on top (siblings are flat-composited, not depth-sorted).
  const zIndex = useTransform(() => 10 - Math.round(Math.abs(index - position.get()) * 2));

  return (
    <motion.article
      aria-labelledby={`${idPrefix}-${b.slug}`}
      aria-hidden={!current}
      inert={!current}
      className={cn(
        "absolute flex flex-col overflow-hidden rounded-card border border-line bg-surface shadow-2xl shadow-brand-navy/15 [--card-w:min(40vw,34rem)] [--half:calc(var(--card-w)/2)] [backface-visibility:hidden] md:h-[88%] md:w-[var(--card-w)]",
        phonePrism
          ? "h-[min(92%,34rem)] w-[var(--card-w)] max-md:[--card-w:80vw]"
          : "h-[min(96%,34rem)] w-[72%]",
      )}
      style={{ transform, opacity, zIndex }}
    >
      <div className={cn("relative shrink-0 overflow-hidden md:h-[52%]", phonePrism ? "h-[50%]" : "h-[52%]")}>
        <BusinessPhoto
          business={b}
          sizes={`(min-width: 1280px) 544px, (min-width: 768px) 40vw, ${phonePrism ? 80 : 72}vw`}
        />
      </div>
      <div className="flex min-h-0 flex-1 flex-col p-4 md:p-7">
        <p className="font-display text-[0.65rem] font-medium tracking-[0.25em] text-brand-blue md:text-xs">
          {pad2(index + 1)} — {b.nameEn.toUpperCase()}
        </p>
        <h3
          id={`${idPrefix}-${b.slug}`}
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
