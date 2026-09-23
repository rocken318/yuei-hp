"use client";

import { useRef } from "react";
import Image from "next/image";
import { motion, useTransform } from "motion/react";
import { ScrollWordReveal } from "@/components/effects/scroll-word-reveal";
import { useGated, useMotionActive } from "@/lib/effects/hooks";
import { useStableScroll } from "@/lib/effects/stable-scroll";

type Props = {
  /** The message, pre-segmented on the server (lines → segments). */
  segments: string[][];
};

/**
 * Company message (client part; see message.tsx). A 200svh (phones) /
 * 250svh (md+) track with a sticky 100svh stage: the
 * Kokubuncho city (B2) fades/zooms in as the section arrives, then the
 * message darkens segment by segment with the section's scroll progress.
 * Reduced motion / SSR: background and text are shown fully, static, and
 * under reduced motion the track collapses to one screen.
 */
export function MessageStage({ segments }: Props) {
  const sectionRef = useRef<HTMLElement>(null);
  const active = useMotionActive();

  // Pinned phase: 0 when the section top hits the viewport top, 1 at its end.
  // Measured against the small viewport (see useStableScroll), so the reveal
  // doesn't jump when the iOS toolbar reappears on the way back up.
  const scrollYProgress = useStableScroll(sectionRef, ["start start", "end end"]);
  // Arrival phase: the section rising into view (crossfade out of the hero).
  const arrival = useStableScroll(sectionRef, ["start end", "start start"]);

  // Finish the reveal a little before the pin releases so the full message holds.
  const reveal = useTransform(scrollYProgress, [0.04, 0.8], [0, 1]);

  // Gate on `active` (SSR / reduced motion → static).
  const bgOpacity = useGated(useTransform(arrival, [0, 0.9], [0, 1]), active, 1);
  const bgScale = useGated(
    () => 1.18 - 0.12 * arrival.get() - 0.06 * scrollYProgress.get(),
    active,
    1,
  );
  // Soft leading edge while the stage rises over the end of the hero. Static
  // (SSR / reduced motion) keeps it on, so the overlap never shows a hard edge.
  const edgeFade = useGated(() => 1 - arrival.get(), active, 1);
  const barScale = useGated(reveal, active, 1);

  return (
    <section
      ref={sectionRef}
      data-testid="message"
      aria-labelledby="message-heading"
      // md+: overlaps the last 30svh of the hero's pinned track so the city
      // crossfades in over the hero instead of after a blank gap (the hero
      // copy sits mid-left there, clear of the rising edge). Phones: no
      // overlap — the hero headline sits low in the stage, exactly where the
      // overlap's white leading edge would wash over it, so the hero scrolls
      // off first and the city fades in beneath it afterwards.
      className="relative z-10 h-[200svh] md:-mt-[30svh] md:h-[250svh] motion-reduce:mt-0 motion-reduce:h-svh md:motion-reduce:h-svh"
    >
      <div className="sticky top-0 h-svh overflow-hidden">
        <motion.div
          aria-hidden="true"
          className="absolute inset-0 origin-[70%_60%] will-change-transform"
          style={{ opacity: bgOpacity, scale: bgScale }}
        >
          <Image
            src="/images/generated/mood-b-city.webp"
            alt=""
            fill
            sizes="100vw"
            className="object-cover object-[72%_50%] md:object-center"
          />
        </motion.div>

        {/* White veil: keeps ink text at AA contrast over the high-key city,
            also for the right end of the long lines on desktop. */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-b from-surface/85 via-surface/78 to-surface/90 md:bg-gradient-to-r md:from-surface/92 md:from-10% md:via-surface/80 md:via-55% md:to-surface/30"
        />

        {/* Soft edges: top while arriving from the hero, bottom on the way out.
            The top edge stays above the text column (phones: a short band
            under the header; the copy is vertically centred below it). */}
        <motion.div
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-20 md:h-1/3 bg-linear-to-b from-surface to-transparent"
          style={{ opacity: edgeFade }}
        />
        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-1/4 bg-linear-to-t from-surface to-transparent"
        />

        <div className="relative mx-auto flex h-full max-w-7xl items-center px-5 pt-16 md:px-8 md:pt-20">
          <div className="flex w-full gap-5 md:gap-10">
            {/* Scroll progress rail */}
            <div aria-hidden="true" className="relative w-px shrink-0 bg-line">
              <motion.div
                className="absolute inset-0 origin-top bg-brand-blue"
                style={{ scaleY: barScale }}
              />
            </div>

            <div className="min-w-0 py-2">
              <h2
                id="message-heading"
                className="font-display text-xs font-medium tracking-[0.3em] text-brand-blue md:text-sm"
              >
                MESSAGE
                <span className="ml-3 font-sans tracking-[0.15em] text-ink-muted">
                  / 私たちの想い
                </span>
              </h2>

              <ScrollWordReveal
                segments={segments}
                progress={reveal}
                className="mt-5 max-w-[18em] font-heading text-[1.375rem] leading-[1.75] font-bold tracking-[0.02em] text-ink sm:text-3xl md:tracking-[0.04em] md:mt-7 md:text-5xl md:leading-[1.55]"
                lineClassName="mt-3 md:mt-5"
                wordClassName="inline-block"
                              />

              <p className="mt-10 font-display text-[0.7rem] tracking-[0.3em] text-ink-muted md:mt-14 md:text-xs">
                KOKUBUNCHO, SENDAI
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default MessageStage;
