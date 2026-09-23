import { Fragment } from "react";
import { Marquee } from "@/components/effects/marquee";
import { cn } from "@/lib/utils";

type Props = {
  /** One word per business, in display form (see marqueeWords in app/page.tsx). */
  words: string[];
};

/**
 * Oversized business-name band. Filled and outlined words alternate; the
 * band speeds up (and flips) with scroll velocity via Marquee. Decorative:
 * the businesses themselves are listed in the section above.
 */
export function BusinessMarquee({ words }: Props) {
  return (
    <div
      data-testid="marquee"
      aria-hidden="true"
      className="relative overflow-hidden border-y border-line bg-surface py-6 md:py-10"
    >
      <Marquee baseVelocity={3} repeat={3}>
        <div className="flex items-center font-display text-[3.25rem] leading-none font-bold tracking-tight whitespace-nowrap md:text-[9rem]">
          {words.map((word, i) => (
            <Fragment key={word}>
              <span
                className={cn(
                  "px-5 md:px-10",
                  i % 2 === 0
                    ? "text-brand-blue"
                    : "text-transparent [-webkit-text-stroke:1.5px_var(--color-brand-navy)] md:[-webkit-text-stroke:2px_var(--color-brand-navy)]",
                )}
              >
                {word}
              </span>
              <span className="text-[0.4em] text-brand-sky">◆</span>
            </Fragment>
          ))}
        </div>
      </Marquee>
    </div>
  );
}

export default BusinessMarquee;
