"use client";

import { useRef } from "react";
import { motion, useScroll, type MotionValue } from "motion/react";
import { Reveal } from "@/components/effects/reveal";
import { SectionEyebrow } from "@/components/sections/home/section-eyebrow";
import { useGated, useMotionActive } from "@/lib/effects/hooks";
import { cn, pad2 } from "@/lib/utils";

type Step = { step?: string; title: string; body: string };

type Props = { steps: Step[] };

/**
 * Where the timeline's "progress tip" sits: the fill reaches a point on the
 * line as that point crosses this line of the viewport.
 */
const TIP = "60%";
/** Markers start growing a little before the tip reaches them. */
const MARKER_FROM = "68%";

/**
 * Digital business: the production flow as a vertical timeline. The line
 * between the step markers fills as the page scrolls and each marker turns
 * solid when the fill reaches it. Server, hydration and reduced motion: the
 * whole timeline is shown filled (static).
 */
export function FlowTimeline({ steps }: Props) {
  const active = useMotionActive();
  if (steps.length === 0) return null;

  return (
    <section data-testid="flow" aria-labelledby="flow-heading" className="bg-surface py-24 md:py-36">
      <div className="mx-auto grid max-w-7xl gap-12 px-5 md:px-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
        <div className="lg:sticky lg:top-32 lg:self-start">
          <Reveal>
            <SectionEyebrow>FLOW</SectionEyebrow>
            <h2 id="flow-heading" className="mt-4 text-3xl font-bold text-ink md:text-5xl">
              制作の流れ
            </h2>
            <p className="mt-5 max-w-md text-sm leading-[2] text-ink-muted [word-break:auto-phrase] md:mt-6 md:text-base">
              ご相談から公開後の運用まで、一貫してサポートします。
            </p>
          </Reveal>
        </div>
        <ol className="relative">
          {steps.map((s, i) => (
            <FlowStep
              key={s.title}
              step={s}
              index={i}
              last={i === steps.length - 1}
              active={active}
            />
          ))}
        </ol>
      </div>
    </section>
  );
}

type StepProps = { step: Step; index: number; last: boolean; active: MotionValue<number> };

function FlowStep({ step, index, last, active }: StepProps) {
  const ref = useRef<HTMLLIElement>(null);
  // Marker: grows 0 → 1 as the top of this step approaches the tip line.
  const { scrollYProgress: markerProgress } = useScroll({
    target: ref,
    offset: [`start ${MARKER_FROM}`, `start ${TIP}`],
  });
  // Segment below the marker: fills while this step passes the tip line.
  const { scrollYProgress: segmentProgress } = useScroll({
    target: ref,
    offset: [`start ${TIP}`, `end ${TIP}`],
  });
  const reached = useGated(markerProgress, active, 1);
  const fill = useGated(segmentProgress, active, 1);
  const label = step.step ?? pad2(index + 1);

  return (
    <li
      ref={ref}
      className={cn(
        "relative grid grid-cols-[3rem_minmax(0,1fr)] gap-5 md:grid-cols-[4rem_minmax(0,1fr)] md:gap-8",
        !last && "pb-12 md:pb-16",
      )}
    >
      {/* Track + fill, from this marker's centre down to the next marker. */}
      {!last && (
        <div aria-hidden className="absolute bottom-0 left-6 top-6 w-px -translate-x-1/2 bg-line md:left-8 md:top-8">
          <motion.div className="absolute inset-0 origin-top bg-brand-blue" style={{ scaleY: fill }} />
        </div>
      )}
      <div className="relative flex size-12 items-center justify-center md:size-16">
        <span aria-hidden className="absolute inset-0 rounded-full border border-brand-blue/30 bg-surface" />
        <motion.span aria-hidden className="absolute inset-0 rounded-full bg-brand-blue" style={{ scale: reached }} />
        <span className="relative font-display text-sm font-medium tracking-[0.1em] text-brand-blue md:text-base">
          {label}
        </span>
        <motion.span
          aria-hidden
          className="absolute inset-0 flex items-center justify-center font-display text-sm font-medium tracking-[0.1em] text-surface md:text-base"
          style={{ opacity: reached }}
        >
          {label}
        </motion.span>
      </div>
      <div className="pt-2.5 md:pt-4">
        <h3 className="text-lg font-bold text-ink md:text-2xl">{step.title}</h3>
        <p className="mt-3 text-sm leading-[1.9] text-ink-muted [word-break:auto-phrase] md:text-base">{step.body}</p>
      </div>
    </li>
  );
}
