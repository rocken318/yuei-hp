"use client";

import { useRef } from "react";
import { motion } from "motion/react";
import { Reveal } from "@/components/effects/reveal";
import { useGated, useMotionActive } from "@/lib/effects/hooks";
import { useStableScroll } from "@/lib/effects/stable-scroll";
import { SectionHeading } from "./section-heading";

type Props = { items: { date: string; text: string }[] };

/**
 * 沿革: vertical timeline. The line fills as the list passes the middle of
 * the viewport (plain scroll progress, so touch behaves the same); entries
 * fade in. SSR / reduced motion: line full.
 */
export function History({ items }: Props) {
  const listRef = useRef<HTMLOListElement>(null);
  const active = useMotionActive();
  const scrollYProgress = useStableScroll(listRef, ["start 0.7", "end 0.5"]);
  const fill = useGated(scrollYProgress, active, 1);

  return (
    <section data-testid="history" aria-labelledby="history-heading" className="bg-surface-muted py-24 md:py-36">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 md:grid-cols-[minmax(0,4fr)_minmax(0,8fr)] md:gap-12 md:px-8">
        <SectionHeading id="history-heading" eyebrow="HISTORY" className="md:sticky md:top-32 md:self-start">
          沿革
        </SectionHeading>

        <ol ref={listRef} className="relative">
          <span aria-hidden className="absolute bottom-2 left-[5px] top-2 w-px bg-line" />
          <motion.span
            aria-hidden
            className="absolute bottom-2 left-[5px] top-2 w-px origin-top bg-brand-blue"
            style={{ scaleY: fill }}
          />
          {items.map((item, i) => (
            <li key={`${item.date}-${i}`} className="relative pb-10 pl-9 last:pb-0 md:pb-12 md:pl-12">
              <span
                aria-hidden
                className="absolute left-0 top-[0.45em] size-[11px] rounded-full border-2 border-brand-blue bg-surface"
              />
              <Reveal>
                <p className="font-display text-sm font-medium tracking-[0.12em] text-brand-blue md:text-base">
                  {item.date}
                </p>
                <p className="mt-2 text-[0.9375rem] leading-[1.9] text-ink [word-break:auto-phrase] md:text-base">
                  {item.text}
                </p>
              </Reveal>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
