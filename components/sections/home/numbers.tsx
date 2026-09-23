import { NumberTicker } from "@/components/effects/number-ticker";
import { Reveal } from "@/components/effects/reveal";

type Props = {
  /** Number of business domains (content/businesses). */
  businessCount: number;
  /** Venues with kind "store" across nightlife + dining. */
  storeCount: number;
  /** Signage venues (遊栄ビジョン locations). */
  signageCount: number;
};

/**
 * Home §6 — 数字で見る遊栄JAPAN. Every figure is computed from content by the
 * page; nothing here is a hand-written number.
 */
export function Numbers({ businessCount, storeCount, signageCount }: Props) {
  const items = [
    { label: "事業領域", en: "BUSINESS DOMAINS", value: businessCount, unit: "事業" },
    { label: "運営店舗", en: "STORES", value: storeCount, unit: "店舗" },
    { label: "設置ビジョン", en: "YUEI VISION", value: signageCount, unit: "拠点" },
  ];

  return (
    <section aria-labelledby="numbers-heading" className="bg-surface py-24 md:py-36">
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <Reveal className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="flex items-center gap-3 font-display text-xs tracking-[0.3em] text-brand-blue">
              <span aria-hidden className="h-px w-8 bg-brand-blue/60" />
              YUEI IN NUMBERS
            </p>
            <h2 id="numbers-heading" className="mt-5 text-[1.75rem] font-bold leading-[1.35] md:text-4xl">
              数字で見る遊栄JAPAN
            </h2>
          </div>
          <p className="text-sm leading-relaxed text-ink-muted">国分町を拠点に、領域を越えて。</p>
        </Reveal>

        <dl className="mt-12 grid grid-cols-3 md:mt-16">
          {items.map((item, i) => (
            <Reveal
              key={item.label}
              delay={i * 0.1}
              className="flex flex-col-reverse border-l border-line px-3 py-2 first:border-l-0 first:pl-0 sm:px-6 md:px-10 md:py-4"
            >
              <dt className="mt-3 flex flex-col gap-1 md:flex-row md:items-baseline md:gap-3">
                <span className="text-xs font-bold text-ink sm:text-sm">{item.label}</span>
                <span className="hidden font-display text-[0.625rem] tracking-[0.25em] text-ink-muted sm:inline">{item.en}</span>
              </dt>
              <dd className="flex items-baseline gap-1 md:gap-2">
                <NumberTicker
                  value={item.value}
                  delay={i * 0.12}
                  className="bg-brand-gradient bg-clip-text font-display text-6xl font-bold leading-none tracking-tight text-transparent md:text-8xl lg:text-9xl"
                />
                <span className="text-sm font-bold text-brand-navy md:text-lg">{item.unit}</span>
              </dd>
            </Reveal>
          ))}
        </dl>
      </div>
    </section>
  );
}
