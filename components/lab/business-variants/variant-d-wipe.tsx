"use client";

import { useRef } from "react";
import { motion, useTransform } from "motion/react";
import { useGated, useMotionActive } from "@/lib/effects/hooks";
import { useStableScroll } from "@/lib/effects/stable-scroll";
import { pad2 } from "@/lib/utils";
import { BusinessPhoto, BusinessTitle, DetailLink, SectionHeading, StaticBusinessList } from "./shared";
import { clamp01, slantPolygon } from "./progress";
import type { LabBusiness } from "./types";

type Props = { businesses: LabBusiness[] };

/**
 * D. Full-screen wipe. Every business gets its own pinned, full-viewport
 * scene (a 220svh track with a sticky 100svh stage). On a navy ground the
 * number and latin name wait in the middle; a slanted parallelogram — cut
 * like the pieces of the Yuei mark — opens from a small shard to past the
 * edges, revealing the photo, which zooms out slightly as it opens. Then the
 * copy slides in over a navy gradient that keeps the white text at AA.
 *
 * Reduced motion: the scenes are hidden and a static list is shown.
 */
export function VariantDWipe({ businesses }: Props) {
  return (
    <section data-testid="lab-variant-d" aria-labelledby="lab-d-heading" className="relative bg-surface">
      <SectionHeading id="lab-d-heading" className="mx-auto max-w-7xl px-5 pt-24 pb-10 md:px-8 md:pt-36 md:pb-16" />

      <div className="motion-reduce:hidden">
        {businesses.map((b, i) => (
          <Scene key={b.slug} business={b} index={i} count={businesses.length} />
        ))}
      </div>

      <div className="hidden motion-reduce:block">
        <StaticBusinessList businesses={businesses} idPrefix="lab-d-static" />
      </div>
    </section>
  );
}

function Scene({ business: b, index, count }: { business: LabBusiness; index: number; count: number }) {
  const sceneRef = useRef<HTMLDivElement>(null);
  const active = useMotionActive();
  // SSR / hydration: fully revealed (the static end state of each scene).
  const raw = useStableScroll(sceneRef, ["start start", "end end"]);
  const p = useGated(raw, active, 1);
  // Arrival: the stage rising into view, before it pins.
  const arrivalRaw = useStableScroll(sceneRef, ["start end", "start start"]);
  const arrival = useGated(arrivalRaw, active, 1);

  // The shape starts opening as the scene arrives and is fully open by 55% of the pin.
  const open = useTransform(() => clamp01((arrival.get() - 0.55) / 0.45) * 0.18 + clamp01(p.get() / 0.55) * 0.82);
  const clipPath = useTransform(() => slantPolygon(open.get()));
  const photoScale = useTransform(() => 1.3 - 0.3 * clamp01(p.get() / 0.85));
  // Copy: slides in after the photo has mostly opened.
  const copy = useTransform(() => clamp01((p.get() - 0.42) / 0.3));
  const copyX = useTransform(() => `${(1 - copy.get()) * -3}rem`);
  const scrim = useTransform(() => clamp01((p.get() - 0.2) / 0.25));
  // The waiting label fades as the photo takes over.
  const labelOpacity = useTransform(() => 1 - clamp01((open.get() - 0.35) / 0.3));

  return (
    <div ref={sceneRef} data-testid="lab-d-scene" className="relative h-[220svh]">
      <article
        aria-labelledby={`lab-d-${b.slug}`}
        className="sticky top-0 isolate h-svh overflow-hidden bg-brand-navy"
      >
        {/* The photo, cut by the growing parallelogram. */}
        <motion.div aria-hidden="true" className="absolute inset-0" style={{ clipPath }}>
          <motion.div className="absolute inset-0 will-change-transform" style={{ scale: photoScale }}>
            <BusinessPhoto business={b} sizes="100vw" />
          </motion.div>
          <motion.div
            className="absolute inset-0 bg-linear-to-t from-brand-navy/95 via-brand-navy/60 via-45% to-brand-navy/10 md:bg-linear-to-r md:from-brand-navy/90 md:via-brand-navy/55 md:via-45% md:to-brand-navy/5"
            style={{ opacity: scrim }}
          />
        </motion.div>

        {/* Waiting label: over the opening shard, fading as the photo takes over. */}
        <motion.div
          aria-hidden="true"
          className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center"
          style={{ opacity: labelOpacity }}
        >
          <span className="font-display text-[7rem] leading-none font-bold text-transparent [-webkit-text-stroke:1.5px_var(--color-brand-sky)] md:text-[14rem]">
            {pad2(index + 1)}
          </span>
          <span className="font-display text-xs tracking-[0.35em] text-brand-sky md:text-sm">
            {b.nameEn.toUpperCase()}
          </span>
        </motion.div>

        <div className="relative mx-auto flex h-full max-w-7xl flex-col justify-end px-5 pt-[calc(4rem+var(--lab-bar,0px))] pb-10 md:justify-center md:px-8 md:pb-0">
          <motion.div className="max-w-xl" style={{ opacity: copy, x: copyX }}>
            <p className="font-display text-[0.7rem] font-medium tracking-[0.25em] text-brand-sky md:text-xs">
              {pad2(index + 1)} / {pad2(count)} — {b.nameEn.toUpperCase()}
            </p>
            <h3
              id={`lab-d-${b.slug}`}
              className="mt-3 text-[1.625rem] leading-snug font-bold text-surface md:mt-5 md:text-5xl md:leading-tight"
            >
              <BusinessTitle business={b} />
            </h3>
            {b.subName ? <p className="mt-1 text-xs text-surface/80 md:mt-3 md:text-sm">{b.subName}</p> : null}
            {b.lead ? (
              <p className="mt-4 text-base leading-relaxed font-bold text-surface md:mt-7 md:text-xl">{b.lead}</p>
            ) : null}
            <p className="mt-3 text-sm leading-relaxed text-surface/85 [word-break:auto-phrase] md:mt-4 md:text-base md:leading-loose">
              {b.summary}
            </p>
            <DetailLink business={b} tone="onDark" className="mt-6 md:mt-9" />
          </motion.div>
        </div>
      </article>
    </div>
  );
}

export default VariantDWipe;
