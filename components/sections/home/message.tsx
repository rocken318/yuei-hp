"use client";

import { useRef } from "react";
import Image from "next/image";
import { motion, useScroll, useTransform } from "motion/react";
import { ScrollWordReveal } from "@/components/effects/scroll-word-reveal";
import { useMotionActive } from "@/lib/effects/hooks";

const MESSAGE = [
  "国分町の夜から、街の未来へ。",
  "人が集い、語らい、笑顔になる場所を。",
  "飲食、エンターテインメント、デジタルサイネージ、そしてWeb。",
  "私たちは領域を越えて、この街に新しい価値を届けます。",
].join("\n");

/**
 * Company message. A ~250svh track with a sticky 100svh stage: the
 * Kokubuncho city (B2) fades/zooms in as the section arrives, then the
 * message darkens segment by segment with the section's scroll progress.
 * Reduced motion / SSR: background and text are shown fully, static.
 */
export function Message() {
  const sectionRef = useRef<HTMLElement>(null);
  const active = useMotionActive();

  // Pinned phase: 0 when the section top hits the viewport top, 1 at its end.
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });
  // Arrival phase: the section rising into view (crossfade out of the hero).
  const { scrollYProgress: arrival } = useScroll({
    target: sectionRef,
    offset: ["start end", "start start"],
  });

  // Finish the reveal a little before the pin releases so the full message holds.
  const reveal = useTransform(scrollYProgress, [0.04, 0.8], [0, 1]);

  const bgOpacityRaw = useTransform(arrival, [0, 0.9], [0, 1]);
  const bgScaleRaw = useTransform(
    () => 1.18 - 0.12 * arrival.get() - 0.06 * scrollYProgress.get(),
  );
  // Gate on `active` (SSR / reduced motion → static). Sources are read before
  // branching because useTransform(fn) only subscribes to values it reads on
  // its first run, when `active` is still 0.
  const bgOpacity = useTransform(() => {
    const v = bgOpacityRaw.get();
    return active.get() ? v : 1;
  });
  const bgScale = useTransform(() => {
    const v = bgScaleRaw.get();
    return active.get() ? v : 1;
  });
  const barScale = useTransform(() => {
    const v = reveal.get();
    return active.get() ? v : 1;
  });

  return (
    <section
      ref={sectionRef}
      aria-labelledby="message-heading"
      className="relative h-[250svh] bg-surface"
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

        {/* White veil: keeps ink text at AA contrast over the high-key city. */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-b from-surface/85 via-surface/70 to-surface/90 md:bg-gradient-to-r md:from-surface/90 md:via-surface/72 md:to-surface/25"
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
                <span className="ml-3 font-heading tracking-[0.15em] text-ink-muted">
                  / 私たちの想い
                </span>
              </h2>

              <ScrollWordReveal
                text={MESSAGE}
                progress={reveal}
                className="mt-5 max-w-[18em] font-heading text-[1.375rem] leading-[1.75] font-bold tracking-[0.02em] text-ink sm:text-3xl md:tracking-[0.04em] md:mt-7 md:text-5xl md:leading-[1.55]"
                lineClassName="mt-3 md:mt-5"
                wordClassName="inline-block"
                restOpacity={0.14}
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

export default Message;
