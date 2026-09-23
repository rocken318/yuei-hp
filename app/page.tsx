import { content } from "@/lib/content";
import { Reveal } from "@/components/effects/reveal";
import { Hero } from "@/components/sections/home/hero";

export default async function HomePage() {
  const businesses = await content.getBusinesses();
  return (
    <>
      <Hero />

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
