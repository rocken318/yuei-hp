import { Reveal } from "@/components/effects/reveal";
import { DraftBadge } from "@/components/page/draft-badge";
import { paragraphs } from "@/lib/page/text";
import { SectionHeading } from "./section-heading";

type Props = {
  greeting: { title: string; body: string; signature?: string; draft: boolean };
};

/**
 * ごあいさつ. Editorial two-column layout: the heading stays in view (md+)
 * while the letter runs down a thin rule; the first paragraph is set as a
 * lead. Rendering is gated by the page (drafts never reach production); a
 * draft carries the DraftBadge.
 */
export function Greeting({ greeting }: Props) {
  const [lead, ...rest] = paragraphs(greeting.body);
  return (
    <section
      data-testid="greeting"
      aria-labelledby="greeting-heading"
      className="bg-surface-muted py-24 md:py-32"
    >
      <div className="mx-auto grid max-w-7xl gap-10 px-5 md:grid-cols-[minmax(0,4fr)_minmax(0,8fr)] md:gap-12 md:px-8">
        <div className="md:sticky md:top-32 md:self-start">
          <SectionHeading id="greeting-heading" eyebrow="MESSAGE">
            {greeting.title}
          </SectionHeading>
          {greeting.draft && <DraftBadge className="mt-6" />}
        </div>

        <div className="border-l border-brand-blue/25 pl-6 md:pl-12">
          {lead && (
            <Reveal>
              <p className="font-heading text-lg font-bold leading-[1.9] text-brand-navy [word-break:auto-phrase] md:text-2xl md:leading-[1.8]">
                {lead}
              </p>
            </Reveal>
          )}
          <div className="mt-8 space-y-6 md:mt-12 md:space-y-8">
            {rest.map((p, i) => (
              <Reveal key={i}>
                <p className="text-[0.9375rem] leading-[2.1] text-ink [word-break:auto-phrase] md:text-base md:leading-[2.2]">
                  {p}
                </p>
              </Reveal>
            ))}
          </div>
          {greeting.signature && (
            <Reveal className="mt-12 flex items-center justify-end gap-4 md:mt-16">
              <span aria-hidden className="h-px w-10 bg-brand-blue/50" />
              <p className="whitespace-pre-line text-right text-sm font-bold leading-[1.9] text-ink md:text-base">
                {greeting.signature}
              </p>
            </Reveal>
          )}
        </div>
      </div>
    </section>
  );
}
