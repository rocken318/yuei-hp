"use client";

import { useRef } from "react";
import { motion, useTransform, type MotionValue } from "motion/react";
import { useGated, useMotionActive } from "@/lib/effects/hooks";
import { useStableScroll } from "@/lib/effects/stable-scroll";
import { cn, pad2 } from "@/lib/utils";
import { BusinessPhoto, BusinessTitle, DetailLink, SectionHeading } from "./shared";
import { useActiveIndex } from "./hooks";
import { stepPosition } from "./progress";
import type { LabBusiness } from "./types";

type Props = { businesses: LabBusiness[] };

/** Plateau per panel, relative to one slide (see stepPosition). */
const HOLD = 0.35;

/**
 * B. Horizontal scroll. A tall section (one 100svh per business) pins a
 * 100svh stage; scrolling down slides a track of panels to the left, one
 * panel per step, with a short hold on each. Panels are 85vw (phones) /
 * 70vw (md+) with a gap, centred so the neighbours peek in. Inside each
 * panel the photo drifts against the slide (parallax). A progress bar and a
 * "01 / 04" counter show where you are.
 *
 * Reduced motion: the pinned track is hidden and the panels become a native,
 * swipeable scroll-snap row (no scroll-linked motion).
 */
export function VariantBHorizontal({ businesses }: Props) {
  const count = businesses.length;
  const sectionRef = useRef<HTMLDivElement>(null);
  const active = useMotionActive();
  const raw = useStableScroll(sectionRef, ["start start", "end end"]);
  const progress = useGated(raw, active, 0);
  const position = useTransform(() => stepPosition(progress.get(), count, HOLD));
  const index = useActiveIndex(position, count);

  // One step = panel width + gap, as CSS lengths (see the --panel/--gap vars).
  const x = useTransform(() => `calc(${-position.get()} * (var(--panel) + var(--gap)))`);

  return (
    <section
      data-testid="lab-variant-b"
      aria-labelledby="lab-b-heading"
      className="relative bg-surface-muted"
    >
      <div
        ref={sectionRef}
        style={{ height: `${count * 100}svh` }}
        className="relative [--gap:4vw] [--panel:85vw] motion-reduce:hidden md:[--gap:2.5vw] md:[--panel:70vw]"
      >
        <div className="sticky top-0 flex h-svh flex-col overflow-hidden pt-[calc(4rem+var(--lab-bar,0px))] md:pt-[calc(5rem+var(--lab-bar,0px))]">
          <div className="mx-auto flex w-full max-w-7xl items-end justify-between px-5 pt-4 md:px-8 md:pt-8">
            <SectionHeading id="lab-b-heading" />
            <p className="pb-1 font-display text-sm font-medium tracking-[0.2em] text-ink md:text-base" aria-live="polite">
              <span className="text-brand-blue">{pad2(index + 1)}</span>
              <span className="mx-2 text-ink-muted">/</span>
              <span className="text-ink-muted">{pad2(count)}</span>
            </p>
          </div>

          <div className="flex min-h-0 flex-1 items-center py-5 md:py-8">
            <motion.ol
              className="flex h-full max-h-[40rem] gap-[var(--gap)] pl-[calc((100vw-var(--panel))/2)] will-change-transform"
              style={{ x }}
            >
              {businesses.map((b, i) => (
                <Panel key={b.slug} business={b} index={i} position={position} current={i === index} />
              ))}
            </motion.ol>
          </div>

          <div className="mx-auto w-full max-w-7xl px-5 pb-6 md:px-8 md:pb-10">
            <div aria-hidden="true" className="h-0.5 w-full overflow-hidden rounded-full bg-line">
              <motion.div className="h-full origin-left bg-brand-blue" style={{ scaleX: progress }} />
            </div>
          </div>
        </div>
      </div>

      {/* Reduced motion: swipeable row. */}
      <div className="hidden motion-reduce:block">
        <SectionHeading id="lab-b-heading-static" className="mx-auto max-w-7xl px-5 pt-24 md:px-8 md:pt-36" />
        <ol className="mt-10 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-24 md:gap-8 md:px-8 md:pb-36">
          {businesses.map((b, i) => (
            <li key={b.slug} className="h-[70svh] max-h-[40rem] w-[85vw] shrink-0 snap-center md:w-[70vw]">
              <PanelCard business={b} index={i} />
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function Panel({
  business,
  index,
  position,
  current,
}: {
  business: LabBusiness;
  index: number;
  position: MotionValue<number>;
  current: boolean;
}) {
  // Distance from the centre slot, in panels (negative: already passed).
  const offset = useTransform(() => index - position.get());
  // The photo lags behind the panel: it drifts right as the panel moves left.
  const imageX = useTransform(offset, [-1, 0, 1], ["7%", "0%", "-7%"]);
  const scale = useTransform(offset, [-1, 0, 1], [0.94, 1, 0.94]);

  return (
    <motion.li
      className="h-full w-[var(--panel)] shrink-0 origin-center"
      style={{ scale }}
      aria-current={current ? "true" : undefined}
      // Off-centre panels stay in the tab order: they are links to real pages
      // and focusing one should not be a trap. They are just visually smaller.
    >
      <PanelCard business={business} index={index} imageX={imageX} />
    </motion.li>
  );
}

function PanelCard({
  business: b,
  index,
  imageX,
}: {
  business: LabBusiness;
  index: number;
  imageX?: MotionValue<string>;
}) {
  return (
    <article
      aria-labelledby={`lab-b-${b.slug}${imageX ? "" : "-static"}`}
      className="relative isolate h-full overflow-hidden rounded-card bg-brand-navy shadow-2xl shadow-brand-navy/15"
    >
      {/* Wider than the panel so the parallax never shows an edge. */}
      <motion.div aria-hidden="true" className="absolute inset-y-0 -inset-x-[10%]" style={{ x: imageX }}>
        <BusinessPhoto business={b} sizes="(min-width: 768px) 84vw, 102vw" />
      </motion.div>
      {/* Navy scrim: white text stays AA over any photo. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-linear-to-t from-brand-navy/95 via-brand-navy/55 via-45% to-brand-navy/0 to-75% md:bg-linear-to-r md:from-brand-navy/90 md:via-brand-navy/50 md:via-40% md:to-transparent md:to-70%"
      />

      <div className="relative flex h-full flex-col justify-end p-5 md:max-w-[34rem] md:justify-center md:p-12">
        <p className="font-display text-[0.7rem] font-medium tracking-[0.25em] text-brand-sky md:text-xs">
          {pad2(index + 1)} — {b.nameEn.toUpperCase()}
        </p>
        <h3
          id={`lab-b-${b.slug}${imageX ? "" : "-static"}`}
          className="mt-2 text-[1.375rem] leading-snug font-bold text-surface md:mt-4 md:text-4xl md:leading-tight"
        >
          <BusinessTitle business={b} />
        </h3>
        {b.subName ? <p className="mt-1 text-xs text-surface/80 md:mt-2 md:text-sm">{b.subName}</p> : null}
        <p className="mt-3 text-sm leading-relaxed text-surface/90 [word-break:auto-phrase] md:mt-6 md:text-base md:leading-loose">
          {b.lead ?? b.summary}
        </p>
        <DetailLink business={b} tone="onDark" className="mt-5 md:mt-8" />
      </div>

      <span
        aria-hidden="true"
        className={cn(
          "absolute top-3 right-4 font-display text-[4rem] leading-none font-bold text-transparent md:top-6 md:right-8 md:text-[8rem]",
          "[-webkit-text-stroke:1px_var(--color-brand-sky)]",
        )}
      >
        {pad2(index + 1)}
      </span>
    </article>
  );
}

export default VariantBHorizontal;
