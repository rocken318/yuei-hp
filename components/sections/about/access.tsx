import { ExternalLink, MapPin } from "lucide-react";
import { Reveal } from "@/components/effects/reveal";
import { googleMapsUrl } from "@/lib/page/about";
import { SectionHeading } from "./section-heading";

type Props = { address: string; tel?: string };

/** アクセス: the address and a link out to Google Maps (no embedded map). */
export function Access({ address, tel }: Props) {
  return (
    <section data-testid="access" aria-labelledby="access-heading" className="bg-surface py-24 md:py-36">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 md:grid-cols-[minmax(0,4fr)_minmax(0,8fr)] md:gap-12 md:px-8">
        <SectionHeading id="access-heading" eyebrow="ACCESS">
          アクセス
        </SectionHeading>
        <Reveal>
          <div className="flex flex-col gap-8 rounded-card border border-line p-6 md:flex-row md:items-center md:justify-between md:p-10">
            <div className="flex gap-4">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-sky/40 text-brand-blue">
                <MapPin aria-hidden className="size-5" />
              </span>
              <div>
                <p className="leading-[1.9] text-ink [word-break:auto-phrase]">{address}</p>
                {tel && <p className="mt-1 text-sm text-ink-muted">TEL {tel}</p>}
              </div>
            </div>
            <a
              href={googleMapsUrl(address)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-full border border-brand-blue px-6 py-3 text-sm font-bold text-brand-blue transition-colors duration-hover hover:bg-brand-blue hover:text-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue md:self-auto"
            >
              Google マップで見る
              <ExternalLink aria-hidden className="size-4" />
              <span className="sr-only">（新しいタブで開きます）</span>
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
