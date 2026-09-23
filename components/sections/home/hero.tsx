"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { motion, useMotionValue, useReducedMotion, useScroll, useTransform } from "motion/react";
import { LogoAssemble } from "@/components/effects/logo-assemble";
import { duration, ease } from "@/lib/motion";

/**
 * Home hero. A 200svh scroll track with a sticky 100svh stage: scrolling
 * through it assembles the YUEI mark from pieces scattered over the A2 glass
 * visual, while the photo slowly pushes in.
 *
 * The h1 is the LCP element, so it is server-rendered fully visible (no
 * initial opacity/transform); only scroll-linked transforms touch it.
 * Reduced motion: no scroll-linked motion, the mark is shown assembled.
 */
export function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion() ?? false;
  // Scroll-linked values aren't covered by <MotionConfig reducedMotion>, so
  // gate them here. A motion value (not a render branch) keeps the server and
  // first client render identical.
  const still = useMotionValue(0);
  useEffect(() => {
    still.set(reduced ? 1 : 0);
  }, [reduced, still]);

  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end end"] });
  const p = useTransform(() => {
    const v = scrollYProgress.get();
    return still.get() ? 0 : v;
  });

  const imageScale = useTransform(p, [0, 1], [1, 1.12]);
  const imageY = useTransform(p, [0, 1], ["0%", "-3%"]);
  const imageOpacity = useTransform(p, [0.35, 1], [1, 0.7]);
  const copyY = useTransform(p, [0, 1], [0, -28]);
  const ruleScale = useTransform(() => {
    const v = scrollYProgress.get();
    return still.get() ? 1 : v;
  });
  const cueOpacity = useTransform(p, [0, 0.12], [1, 0]);

  return (
    <section ref={sectionRef} aria-labelledby="hero-heading" className="relative h-[200svh]">
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
          className="absolute inset-y-0 left-0 hidden w-[55%] bg-linear-to-r from-surface/90 via-surface/60 to-transparent md:block"
        />

        <div className="relative mx-auto flex h-full max-w-7xl flex-col justify-end px-5 pb-32 md:justify-center md:px-8 md:pb-0">
          <motion.div style={{ y: copyY }} className="max-w-xl">
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
            <motion.p
              data-reveal
              className="mt-5 max-w-sm text-sm leading-relaxed text-ink-muted md:mt-6 md:max-w-md md:text-base"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: duration.slow, ease: ease.out }}
            >
              国分町から、飲食・エンターテインメント・デジタルサイネージ・Webへ。
            </motion.p>
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
            <motion.span
              className="absolute inset-x-0 top-0 block h-full origin-top bg-brand-blue"
              initial={{ y: "-100%" }}
              animate={{ y: "100%" }}
              transition={{ duration: duration.slow * 1.5, ease: ease.inOut, repeat: Infinity, repeatDelay: 0.3 }}
            />
          </span>
        </motion.div>
      </div>
    </section>
  );
}
