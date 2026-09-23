import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Reveal } from "@/components/effects/reveal";

const LINKS = [
  { href: "/contact", eyebrow: "CONTACT", label: "お問い合わせ", note: "事業・広告掲載・Web制作のご相談はこちら" },
  { href: "/recruit", eyebrow: "RECRUIT", label: "採用情報", note: "採用情報はこちらからご確認ください。" },
] as const;

/**
 * Closing links to contact and recruit. Hover lifts the arrow and brightens
 * the panel on pointer devices; on touch a press-scale gives feedback.
 */
export function AboutCta() {
  return (
    <section data-testid="about-cta" aria-label="お問い合わせと採用情報" className="bg-surface pb-24 md:pb-36">
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <Reveal>
          <ul className="grid overflow-hidden rounded-card bg-brand-navy md:grid-cols-2">
            {LINKS.map((l, i) => (
              <li key={l.href} className={i > 0 ? "border-t border-surface/15 md:border-l md:border-t-0" : undefined}>
                <Link
                  href={l.href}
                  className="group flex h-full items-end justify-between gap-6 p-7 text-surface transition-[background-color,transform] duration-hover hover:bg-brand-blue active:scale-[0.98] focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-brand-sky md:p-12 md:active:scale-100"
                >
                  <span>
                    <span className="block font-display text-xs tracking-[0.3em] text-brand-sky">{l.eyebrow}</span>
                    <span className="mt-3 block text-2xl font-bold md:mt-4 md:text-4xl">{l.label}</span>
                    <span className="mt-3 block text-sm leading-relaxed text-surface/75">{l.note}</span>
                  </span>
                  <span className="flex size-12 shrink-0 items-center justify-center rounded-full border border-surface/30 transition-colors duration-hover group-hover:border-surface group-hover:bg-surface group-hover:text-brand-navy md:size-14">
                    <ArrowRight aria-hidden className="size-5 transition-transform duration-hover group-hover:translate-x-0.5" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
