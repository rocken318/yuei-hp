"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import { ArrowRight, CodeXml, Mail, MonitorPlay } from "lucide-react";
import { Reveal } from "@/components/effects/reveal";
import { useMotionActive } from "@/lib/effects/hooks";

const CONTACT_ENTRIES = [
  { type: "signage", label: "サイネージ広告", note: "遊栄ビジョンへの広告掲載", Icon: MonitorPlay },
  { type: "web", label: "Web制作", note: "Webサイト・システムの制作", Icon: CodeXml },
  { type: "other", label: "その他", note: "取材・その他のお問い合わせ", Icon: Mail },
] as const;

/**
 * Home §7 — recruit banner + contact entry points.
 * The banner photo drifts slightly against the scroll (parallax); reduced
 * motion keeps it still.
 */
export function Cta() {
  const bannerRef = useRef<HTMLDivElement>(null);
  const active = useMotionActive();
  const { scrollYProgress } = useScroll({ target: bannerRef, offset: ["start end", "end start"] });
  const imageY = useTransform(() => (active.get() ? (scrollYProgress.get() - 0.5) * 16 : 0));
  const imageYPercent = useTransform(imageY, (v) => `${v}%`);

  return (
    <section aria-labelledby="recruit-heading" className="bg-surface pb-24 md:pb-36">
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        {/* Recruit banner */}
        <Reveal>
          <div
            ref={bannerRef}
            className="relative isolate overflow-hidden rounded-card bg-surface-muted sm:aspect-[16/9] lg:aspect-[21/9]"
          >
            {/* Phones: photo on top, copy below. sm+: copy over the photo's empty left side. */}
            <div aria-hidden className="relative aspect-[4/3] overflow-hidden sm:absolute sm:inset-0 sm:aspect-auto">
              <motion.div className="absolute inset-x-0 -inset-y-[10%]" style={{ y: imageYPercent }}>
                <Image
                  src="/images/generated/recruit-banner.webp"
                  alt=""
                  fill
                  sizes="(min-width: 1280px) 1216px, 100vw"
                  className="object-cover object-[82%_center] sm:object-center"
                />
              </motion.div>
            </div>
            <div
              aria-hidden
              className="absolute inset-y-0 left-0 hidden w-3/5 bg-linear-to-r from-surface/85 via-surface/50 to-transparent sm:block"
            />

            <div className="relative flex h-full flex-col p-6 pt-8 sm:max-w-[55%] sm:justify-center sm:p-10 lg:p-16">
              <p className="flex items-center gap-3 font-display text-xs tracking-[0.3em] text-brand-blue">
                <span aria-hidden className="h-px w-8 bg-brand-blue/60" />
                RECRUIT
              </p>
              <h2
                id="recruit-heading"
                className="mt-4 text-[1.75rem] font-bold leading-[1.4] text-brand-navy md:text-4xl lg:text-5xl lg:leading-[1.3]"
              >
                この街で、
                <br />
                一緒に未来をつくる。
              </h2>
              <div className="mt-6 lg:mt-10">
                <Link
                  href="/recruit"
                  className="group inline-flex items-center gap-3 rounded-full bg-brand-navy px-7 py-4 text-sm font-bold text-surface transition-colors hover:bg-brand-blue focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-blue"
                >
                  採用情報を見る
                  <ArrowRight aria-hidden className="size-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </div>
            <div aria-hidden className="pointer-events-none absolute inset-0 rounded-card ring-1 ring-inset ring-line" />
          </div>
        </Reveal>

        {/* Contact */}
        <Reveal className="mt-6 md:mt-8">
          <div
            aria-labelledby="contact-heading"
            role="group"
            className="grid gap-8 rounded-card bg-surface-muted p-6 md:grid-cols-[minmax(0,4fr)_minmax(0,8fr)] md:items-center md:gap-12 md:p-10 lg:p-12"
          >
            <div>
              <p className="flex items-center gap-3 font-display text-xs tracking-[0.3em] text-brand-blue">
                <span aria-hidden className="h-px w-8 bg-brand-blue/60" />
                CONTACT
              </p>
              <h2 id="contact-heading" className="mt-4 text-2xl font-bold md:text-3xl">
                お問い合わせ
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-ink-muted">
                ご相談の内容に合わせてお選びください。
              </p>
            </div>
            <ul className="grid gap-3 sm:grid-cols-3">
              {CONTACT_ENTRIES.map(({ type, label, note, Icon }) => (
                <li key={type}>
                  <Link
                    href={`/contact?type=${type}`}
                    className="group flex h-full items-center gap-4 rounded-card border border-line bg-surface p-5 transition-colors hover:border-brand-blue/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue sm:flex-col sm:items-start sm:gap-6"
                  >
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-sky/40 text-brand-blue transition-colors group-hover:bg-brand-blue group-hover:text-surface">
                      <Icon aria-hidden className="size-5" />
                    </span>
                    <span className="flex flex-1 items-end justify-between gap-3 sm:w-full">
                      <span>
                        <span className="block font-bold">{label}</span>
                        <span className="mt-1 block text-xs text-ink-muted">{note}</span>
                      </span>
                      <ArrowRight
                        aria-hidden
                        className="size-4 shrink-0 text-brand-blue transition-transform group-hover:translate-x-1"
                      />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
