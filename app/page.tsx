import { content } from "@/lib/content";
import { Reveal } from "@/components/effects/reveal";

export default async function HomePage() {
  const businesses = await content.getBusinesses();
  return (
    <>
      <section className="relative flex min-h-[100svh] items-center overflow-hidden px-5 md:px-8">
        <div aria-hidden className="bg-brand-gradient absolute -right-40 -top-40 h-[36rem] w-[36rem] rounded-full opacity-20 blur-3xl" />
        <div className="relative mx-auto w-full max-w-7xl">
          <Reveal>
            <p className="font-display text-sm tracking-[0.3em] text-brand-blue">YUEI JAPAN Inc.</p>
          </Reveal>
          <h1 className="mt-4 text-4xl font-bold leading-tight md:text-7xl">
            街の夜に、
            <br />
            新しい価値を。
          </h1>
        </div>
      </section>

      <section data-testid="business-preview" className="mx-auto max-w-7xl px-5 py-24 md:px-8">
        <ul className="grid gap-6 md:grid-cols-2">
          {businesses.map((b, i) => (
            <Reveal as="li" key={b.slug} delay={i * 0.08} className="rounded-card border border-line bg-surface-muted p-8">
              <p className="font-display text-xs tracking-[0.2em] text-brand-blue">{b.nameEn}</p>
              <h2 className="mt-2 text-2xl font-bold">{b.brand ?? b.name}</h2>
              <p className="mt-3 text-sm leading-relaxed text-ink-muted">{b.summary}</p>
            </Reveal>
          ))}
        </ul>
      </section>
    </>
  );
}
