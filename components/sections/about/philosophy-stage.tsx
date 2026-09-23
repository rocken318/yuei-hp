"use client";

import { useRef } from "react";
import { motion, useScroll } from "motion/react";
import { ScrollWordReveal } from "@/components/effects/scroll-word-reveal";
import { useGated, useMotionActive } from "@/lib/effects/hooks";
import { SectionHeading } from "./section-heading";

type Props = {
  title: string;
  /** Body lines, pre-segmented on the server. */
  segments: string[][];
};

/**
 * 企業理念 (client part; see philosophy.tsx). Not pinned: the body darkens
 * word by word as its own block travels from the lower part of the viewport
 * to the middle (plain page scroll, so it works the same with touch), with a
 * rail filling alongside. SSR / reduced motion: text solid, rail full.
 */
export function PhilosophyStage({ title, segments }: Props) {
  const bodyRef = useRef<HTMLDivElement>(null);
  const active = useMotionActive();
  const { scrollYProgress } = useScroll({ target: bodyRef, offset: ["start 0.85", "end 0.5"] });
  const rail = useGated(scrollYProgress, active, 1);

  return (
    <section
      data-testid="philosophy"
      aria-labelledby="philosophy-heading"
      className="relative overflow-hidden bg-surface py-24 md:pb-32 md:pt-40"
    >
      {/* Oversized latin watermark */}
      <p
        aria-hidden
        className="pointer-events-none absolute -right-8 top-16 hidden select-none font-display text-[13rem] font-bold leading-none tracking-[-0.02em] text-brand-sky/25 md:block"
      >
        PHILOSOPHY
      </p>

      <div className="relative mx-auto max-w-7xl px-5 md:px-8">
        <SectionHeading id="philosophy-heading" eyebrow="PHILOSOPHY">
          企業理念
        </SectionHeading>

        <h3 className="mt-10 max-w-[14em] font-heading text-[2rem] font-bold leading-[1.45] tracking-[0.02em] text-brand-navy [word-break:auto-phrase] md:mt-16 md:text-6xl md:leading-[1.35]">
          {/* Keep each 、-delimited phrase whole (e.g. "街の未来へ。" never splits). */}
          {title.split(/(?<=、)/u).map((phrase, i) => (
            <span key={i} className="inline-block">
              {phrase}
            </span>
          ))}
        </h3>

        {segments.length > 0 && (
          <div ref={bodyRef} className="mt-12 flex gap-5 md:mt-20 md:gap-10 md:pl-[8%] lg:pl-[16%]">
            <div aria-hidden className="relative w-px shrink-0 bg-line">
              <motion.div className="absolute inset-0 origin-top bg-brand-blue" style={{ scaleY: rail }} />
            </div>
            <ScrollWordReveal
              segments={segments}
              progress={scrollYProgress}
              className="py-1 font-heading text-lg font-bold leading-[1.9] tracking-[0.02em] text-ink sm:text-xl md:text-3xl md:leading-[1.8]"
              lineClassName="mt-2 first:mt-0 md:mt-4"
              wordClassName="inline-block"
            />
          </div>
        )}
      </div>
    </section>
  );
}
