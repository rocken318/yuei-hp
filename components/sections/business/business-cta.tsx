import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Reveal } from "@/components/effects/reveal";
import { SectionEyebrow } from "@/components/sections/home/section-eyebrow";
import { cn } from "@/lib/utils";

export type BusinessCtaAction = { href: string; label: string };

type Props = {
  /** Latin label above the heading (e.g. "CONTACT"). */
  eyebrow: string;
  title: string;
  body?: string;
  /** The first action is the primary (filled) button; the rest are outlined. */
  actions: BusinessCtaAction[];
  /** Extra classes for the section (e.g. top padding after a tinted section). */
  className?: string;
};

/**
 * Closing call-to-action panel for the business pages: a navy card with the
 * brand gradient glowing from the corner, a heading and one or two buttons.
 * Buttons: hover colours on hover-capable pointers, a press-scale on touch.
 */
export function BusinessCta({ eyebrow, title, body, actions, className }: Props) {
  return (
    <section data-testid="business-cta" aria-labelledby="business-cta-heading" className={cn("bg-surface pb-24 md:pb-36", className)}>
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <Reveal>
          <div className="relative isolate overflow-hidden rounded-card bg-brand-navy px-6 py-12 text-surface md:px-14 md:py-20">
            {/* Gradient glow from the lower right corner. */}
            <div
              aria-hidden
              className="bg-brand-gradient absolute -bottom-1/2 -right-1/4 -z-10 aspect-square w-[42rem] max-w-[140%] rounded-full opacity-70 blur-3xl"
            />
            <div className="grid gap-10 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:items-end lg:gap-16">
              <div>
                <SectionEyebrow tone="onDark">{eyebrow}</SectionEyebrow>
                <h2
                  id="business-cta-heading"
                  className="mt-5 text-[1.75rem] font-bold leading-[1.4] [word-break:auto-phrase] md:text-4xl md:leading-[1.35] lg:text-[2.75rem]"
                >
                  {title}
                </h2>
                {body && (
                  <p className="mt-5 max-w-xl text-sm leading-[2] text-surface/75 [word-break:auto-phrase] md:text-base">
                    {body}
                  </p>
                )}
              </div>
              <ul className="flex flex-col gap-3 sm:flex-row sm:flex-wrap lg:flex-col lg:items-stretch">
                {actions.map((a, i) => (
                  <li key={a.href}>
                    <Link
                      href={a.href}
                      className={cn(
                        "group flex items-center justify-between gap-6 rounded-full px-7 py-4 text-sm font-bold transition-[color,background-color,border-color,transform] duration-hover ease-brand-out active:scale-[0.98] md:active:scale-100 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-sky md:text-base",
                        i === 0
                          ? "bg-surface text-brand-navy hover:bg-brand-sky"
                          : "border border-surface/35 text-surface hover:border-surface hover:bg-surface/10",
                      )}
                    >
                      {a.label}
                      <ArrowRight aria-hidden className="size-4 transition-transform duration-hover group-hover:translate-x-1" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
