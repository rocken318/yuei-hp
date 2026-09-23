import { Clapperboard, LayoutTemplate, LifeBuoy, Workflow, type LucideIcon } from "lucide-react";
import { Reveal } from "@/components/effects/reveal";
import { SectionEyebrow } from "@/components/sections/home/section-eyebrow";
import { pad2 } from "@/lib/utils";

type Service = { title: string; body: string };

/** Icons in content order (site, system, video/signage, operations). */
const ICONS: LucideIcon[] = [LayoutTemplate, Workflow, Clapperboard, LifeBuoy];

/**
 * Digital business: the service list as numbered icon cards (one column on
 * phones, two from md). Cards reveal in a light stagger. The cards are not
 * links, so their hover accent (border, shadow, icon fill) is md+ only.
 */
export function ServiceGrid({ services }: { services: Service[] }) {
  if (services.length === 0) return null;
  return (
    <section data-testid="services" aria-labelledby="services-heading" className="bg-surface-muted py-24 md:py-36">
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <Reveal>
          <SectionEyebrow>SERVICES</SectionEyebrow>
          <h2 id="services-heading" className="mt-4 text-3xl font-bold text-ink md:text-5xl">
            サービス
          </h2>
        </Reveal>
        <ul className="mt-10 grid gap-4 md:mt-16 md:grid-cols-2 md:gap-6">
          {services.map((s, i) => {
            const Icon = ICONS[i % ICONS.length];
            return (
              <Reveal as="li" key={s.title} delay={(i % 2) * 0.08}>
                <article className="group flex h-full flex-col rounded-card border border-line bg-surface p-6 transition-[border-color,box-shadow] duration-hover md:p-10 md:hover:border-brand-blue/30 md:hover:shadow-lg md:hover:shadow-brand-navy/5">
                  <div className="flex items-start justify-between">
                    <span className="flex size-12 items-center justify-center rounded-full bg-brand-sky/40 text-brand-blue transition-colors duration-hover md:size-14 md:group-hover:bg-brand-blue md:group-hover:text-surface">
                      <Icon aria-hidden className="size-5 md:size-6" />
                    </span>
                    <span aria-hidden className="font-display text-xs tracking-[0.2em] text-ink-muted">
                      {pad2(i + 1)}
                    </span>
                  </div>
                  <h3 className="mt-6 text-lg font-bold text-ink md:mt-10 md:text-2xl">{s.title}</h3>
                  <p className="mt-3 text-sm leading-[1.9] text-ink-muted [word-break:auto-phrase] md:text-base">
                    {s.body}
                  </p>
                </article>
              </Reveal>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
