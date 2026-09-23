"use client";

import Image from "next/image";
import { useRef } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import { LogoAssemble } from "@/components/effects/logo-assemble";
import { useGated, useMotionActive } from "@/lib/effects/hooks";
import { delay, duration, ease } from "@/lib/motion";

/**
 * Home hero. A 200svh scroll track with a sticky 100svh stage: scrolling
 * through it assembles the YUEI mark from pieces scattered over the A2 glass
 * visual, while the photo slowly pushes in.
 *
 * The h1 is the LCP element, so it is server-rendered fully visible (no
 * initial opacity/transform); only scroll-linked transforms touch it.
 * Reduced motion: no scroll-linked motion, the mark is shown assembled and
 * the track collapses to a single screen (no pin to scroll through).
 */
export function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  // Scroll-linked values aren't covered by <MotionConfig reducedMotion>, so
  // gate them here. A motion value (not a render branch) keeps the server and
  // first client render identical.
  const active = useMotionActive();

  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end end"] });
  const p = useGated(scrollYProgress, active, 0);

  const imageScale = useTransform(p, [0, 1], [1, 1.12]);
  const imageY = useTransform(p, [0, 1], ["0%", "-3%"]);
  const imageOpacity = useTransform(p, [0.35, 1], [1, 0.35]);
  // Hand-off to the message (md+): the stage's bottom edge dissolves into the
  // surface as the pin releases, so no hard photo edge scrolls up. Phones
  // skip it: their bottom scrim already ends in the surface colour, and a
  // white layer rising there would wash over the low-set headline.
  const exitFade = useTransform(p, [0.55, 1], [0, 1]);
  const copyY = useTransform(p, [0, 1], [0, -28]);
  // Once the pin releases the stage scrolls away under the frosted header.
  // Fade the copy out completely (not a half-washed state) well before the
  // headline gets there: 0 at the release, 1 when the stage has left.
  const { scrollYProgress: exit } = useScroll({ target: sectionRef, offset: ["end end", "end start"] });
  const leaving = useGated(exit, active, 0);
  const copyOpacity = useTransform(leaving, [0.14, 0.28], [1, 0]);
  // md+: the message stage rises over the lower part of the stage from
  // p ≈ 0.7 (its white veil would leave the lead text faintly showing
  // through), so the lead is gone before the overlap reaches it. Phones have
  // no overlap; the lead fades the same way for a consistent hand-off.
  const leadOpacity = useTransform(p, [0.72, 0.9], [1, 0]);
  const ruleScale = useGated(scrollYProgress, active, 1);
  const cueOpacity = useTransform(p, [0, 0.12], [1, 0]);

  return (
    <section ref={sectionRef} data-testid="hero" aria-labelledby="hero-heading" className="relative h-[200svh] motion-reduce:h-svh">
      <div ref={stageRef} className="sticky top-0 h-[100svh] overflow-hidden">
        <motion.div
          aria-hidden
          className="absolute inset-0 will-change-transform"
          style={{ scale: imageScale, y: imageY, opacity: imageOpacity }}
        >
          <Image
            src="/images/generated/mood-a-glass.webp"
            alt=""
            fill
            preload
            sizes="100vw"
            className="object-cover object-[78%_center] md:object-center"
          />
        </motion.div>
        {/* Legibility scrims: bottom on phones (headline sits low), left on desktop. */}
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-[66%] bg-linear-to-t from-surface from-45% via-surface/90 via-65% to-transparent md:hidden"
        />
        <div
          aria-hidden
          className="absolute inset-y-0 left-0 hidden w-[max(55%,calc(50%+16rem))] bg-linear-to-r from-surface/90 via-surface/60 to-transparent md:block"
        />

        <motion.div
          aria-hidden
          className="absolute inset-x-0 bottom-0 hidden h-1/2 bg-linear-to-t from-surface to-transparent md:block"
          style={{ opacity: exitFade }}
        />

        <div className="relative mx-auto flex h-full max-w-7xl flex-col justify-end px-5 pb-32 md:justify-center md:px-8 md:pb-0">
          <motion.div style={{ y: copyY, opacity: copyOpacity }} className="max-w-xl">
            <LogoAssemble progress={scrollYProgress} stageRef={stageRef} className="w-20 md:w-32" />
            <div className="mt-6 flex items-center gap-4 md:mt-8">
              <p className="font-display text-xs tracking-[0.3em] text-brand-blue md:text-sm">YUEI JAPAN Inc.</p>
              <motion.span
                aria-hidden
                className="h-px w-16 origin-left bg-brand-blue/60 md:w-24"
                style={{ scaleX: ruleScale }}
              />
            </div>
            <h1
              id="hero-heading"
              className="mt-4 text-[2.5rem] font-bold leading-[1.2] text-ink md:text-7xl md:leading-[1.15]"
            >
              街の夜に、
              <br />
              新しい価値を。
            </h1>
            <motion.div style={{ opacity: leadOpacity }}>
              <motion.p
                data-reveal
                className="mt-5 max-w-sm text-sm leading-relaxed text-ink-muted md:mt-6 md:max-w-md md:text-base"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: delay.follow, duration: duration.slow, ease: ease.out }}
              >
                国分町から、飲食・エンターテインメント・デジタルサイネージ・Webへ。
              </motion.p>
            </motion.div>
          </motion.div>
        </div>

        <motion.div
          aria-hidden
          className="absolute bottom-6 left-1/2 flex -translate-x-1/2 flex-col items-center gap-3 md:bottom-8"
          style={{ opacity: cueOpacity }}
        >
          <span className="font-display text-[0.625rem] tracking-[0.3em] text-ink-muted">
            SCROLL
          </span>
          <span className="relative block h-10 w-px overflow-hidden bg-line">
            {/* CSS keyframes (no JS frame loop); the global reduced-motion rule stops it. */}
            <span className="absolute inset-x-0 top-0 block h-full animate-scroll-cue bg-brand-blue" />
          </span>
        </motion.div>
      </div>
    </section>
  );
}
