"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useRef, useState, type UIEvent } from "react";
import { motion, useScroll, useTransform, type MotionValue } from "motion/react";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { Reveal } from "@/components/effects/reveal";
import { useMotionActive } from "@/lib/effects/hooks";
import { cn } from "@/lib/utils";
import type { Venue } from "@/lib/content/schema";

export type SignageVenue = Pick<Venue, "slug" | "name" | "catchcopy" | "heroImage">;

type Props = { venues: SignageVenue[] };

/**
 * Illustrative pin positions on the abstract map (percent of the map box),
 * by venue order. NOT real geography — the map is labelled as an image.
 */
const PIN_POSITIONS: { x: number; y: number; side: "right" | "below" }[] = [
  { x: 20, y: 23.3, side: "right" },
  { x: 47.5, y: 50, side: "right" },
  { x: 80, y: 23.3, side: "below" },
  { x: 62.5, y: 76.7, side: "right" },
];

/** Street lines of the abstract map (viewBox 400×300), edges included. */
const STREET_X = [0, 80, 140, 190, 250, 320, 400];
const STREET_Y = [0, 70, 150, 230, 300];

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * Home §5 — 遊栄ビジョン. An abstract district map whose pins light up one by
 * one as the map scrolls through the viewport (scroll-linked, so it follows
 * native touch scrolling too), plus venue cards that swipe horizontally on
 * phones (CSS scroll-snap) and sit in a 4-column grid on desktop.
 * Reduced motion: all pins lit, no scan line, nothing scroll-linked.
 */
export function Signage({ venues }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [highlight, setHighlight] = useState<string | null>(null);
  const [swipeIndex, setSwipeIndex] = useState(0);

  const active = useMotionActive();
  const { scrollYProgress } = useScroll({ target: mapRef, offset: ["start 85%", "end 45%"] });
  // Server/hydration/reduced motion: 1 (= every pin lit, scan finished).
  // Read the source before branching (see cta.tsx / logo-assemble.tsx).
  const p = useTransform(() => {
    const v = scrollYProgress.get();
    return active.get() ? v : 1;
  });
  const scanTop = useTransform(p, [0, 0.9], ["0%", "100%"]);
  const scanOpacity = useTransform(p, [0, 0.06, 0.8, 0.92], [0, 1, 1, 0]);

  // On touch the cards are swiped: follow the snapped card with the pin
  // highlight and the "01 / 04" counter (the hover sync's touch alternative).
  const onSwipe = useCallback(
    (e: UIEvent<HTMLUListElement>) => {
      const el = e.currentTarget;
      if (el.scrollWidth <= el.clientWidth) return;
      const first = el.firstElementChild as HTMLElement | null;
      if (!first) return;
      const step = first.offsetWidth + parseFloat(getComputedStyle(el).columnGap || "0");
      const i = Math.min(venues.length - 1, Math.max(0, Math.round(el.scrollLeft / step)));
      setSwipeIndex(i);
      setHighlight(venues[i]?.slug ?? null);
    },
    [venues],
  );

  return (
    <section
      aria-labelledby="signage-heading"
      className="relative overflow-hidden bg-brand-navy py-24 text-surface md:py-36"
    >
      {/* Soft sky glow, top right. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 right-[-20%] h-[36rem] w-[36rem] rounded-full bg-brand-blue/50 blur-3xl md:right-[-8%]"
      />

      <div className="relative mx-auto max-w-7xl px-5 md:px-8">
        <div className="grid items-center gap-12 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] md:gap-16">
          <Reveal>
            <p className="flex items-center gap-3 font-display text-xs tracking-[0.3em] text-brand-sky">
              <span aria-hidden className="h-px w-8 bg-brand-sky/60" />
              YUEI VISION
              <span className="font-sans tracking-[0.15em] text-surface/60">デジタルサイネージ事業</span>
            </p>
            <h2
              id="signage-heading"
              className="mt-6 text-[2rem] font-bold leading-[1.3] md:text-4xl md:leading-[1.3] xl:text-[2.75rem]"
            >
              国分町の人の流れに、
              <br />
              確実に届く。
            </h2>
            <p className="mt-6 max-w-md text-sm leading-[2] text-surface/75 [word-break:auto-phrase] md:text-base">
              遊栄ビジョンは、仙台・国分町エリアの{venues.length}
              拠点に設置したデジタルサイネージです。街を行き交う人々へ、映像でメッセージを届けます。
            </p>
            <div className="mt-10 hidden flex-wrap items-center gap-6 md:flex">
              <CtaButtons />
            </div>
          </Reveal>

          <div ref={mapRef}>
            <SignageMap
              venues={venues}
              progress={p}
              scanTop={scanTop}
              scanOpacity={scanOpacity}
              highlight={highlight}
              onHighlight={setHighlight}
            />
          </div>
        </div>

        {/* Venue cards: swipe on phones, 4 columns on desktop. */}
        <div className="mt-16 md:mt-24">
          <div className="mb-5 flex items-end justify-between md:mb-8">
            <h3 className="font-display text-xs tracking-[0.3em] text-brand-sky">LOCATIONS</h3>
            <p aria-hidden className="font-display text-xs tracking-[0.2em] text-surface/60 md:hidden">
              <span className="text-surface">{pad(swipeIndex + 1)}</span> / {pad(venues.length)}
            </p>
          </div>
          <ul
            onScroll={onSwipe}
            className="-mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain scroll-px-5 px-5 pb-2 [scrollbar-width:none] md:mx-0 md:grid md:grid-cols-4 md:gap-6 md:overflow-visible md:px-0 md:pb-0 [&::-webkit-scrollbar]:hidden"
          >
            {venues.map((v, i) => (
              <li key={v.slug} className="w-[78%] shrink-0 snap-start sm:w-[45%] md:w-auto">
                <Reveal delay={i * 0.08} className="h-full">
                  <VenueCard
                    venue={v}
                    index={i}
                    active={highlight === v.slug}
                    onHighlight={setHighlight}
                  />
                </Reveal>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-12 flex flex-col items-start gap-5 md:hidden">
          <CtaButtons />
        </div>
      </div>
    </section>
  );
}

function CtaButtons() {
  return (
    <>
      <Link
        href="/contact?type=signage"
        className="group inline-flex items-center gap-3 rounded-full bg-brand-sky px-7 py-4 text-sm font-bold text-brand-navy transition-colors hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-sky"
      >
        広告掲載のご相談
        <ArrowRight aria-hidden className="size-4 transition-transform group-hover:translate-x-1" />
      </Link>
      <Link
        href="/business/signage"
        className="inline-flex items-center gap-2 text-sm text-surface/80 underline-offset-8 transition-colors hover:text-surface hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-sky"
      >
        遊栄ビジョンについて
        <ArrowUpRight aria-hidden className="size-4" />
      </Link>
    </>
  );
}

type MapProps = {
  venues: SignageVenue[];
  progress: MotionValue<number>;
  scanTop: MotionValue<string>;
  scanOpacity: MotionValue<number>;
  highlight: string | null;
  onHighlight: (slug: string | null) => void;
};

function SignageMap({ venues, progress, scanTop, scanOpacity, highlight, onHighlight }: MapProps) {
  return (
    <figure className="relative">
      <div className="relative aspect-[4/3] overflow-hidden rounded-card border border-surface/10 bg-surface/[0.03]">
        <svg
          aria-hidden
          viewBox="0 0 400 300"
          preserveAspectRatio="none"
          className="absolute inset-0 size-full"
        >
          <defs>
            <pattern id="signage-grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M20 0H0V20" fill="none" className="stroke-surface/[0.05]" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="400" height="300" fill="url(#signage-grid)" />
          {/* City blocks between the streets. */}
          <g className="fill-surface/[0.035]">
            {STREET_X.slice(1).flatMap((x, xi) =>
              STREET_Y.slice(1).map((y, yi) => {
                const x0 = STREET_X[xi];
                const y0 = STREET_Y[yi];
                return <rect key={`${xi}-${yi}`} x={x0 + 7} y={y0 + 7} width={x - x0 - 14} height={y - y0 - 14} rx="4" />;
              }),
            )}
          </g>
          {/* Side streets. */}
          <g className="stroke-surface/15" strokeWidth="1.5" fill="none">
            <path d="M80 0V300M140 0V300M250 0V300M320 0V300" />
            <path d="M0 150H400" />
            <path d="M0 262L400 118" strokeDasharray="2 6" />
          </g>
          {/* Main streets. */}
          <g className="stroke-brand-sky/35" strokeWidth="4" fill="none" strokeLinecap="round">
            <path d="M190 0V300" />
            <path d="M0 70H400" />
            <path d="M0 230H400" />
          </g>
        </svg>

        {/* Scan line sweeping top → bottom with the scroll. */}
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 h-20 -translate-y-full bg-linear-to-b from-transparent to-brand-sky/15"
          style={{ top: scanTop, opacity: scanOpacity }}
        >
          <div className="absolute inset-x-0 bottom-0 h-px bg-brand-sky/80" />
        </motion.div>

        {venues.map((v, i) => (
          <MapPin
            key={v.slug}
            venue={v}
            index={i}
            count={venues.length}
            progress={progress}
            active={highlight === v.slug}
            onHighlight={onHighlight}
          />
        ))}

        <p className="absolute left-4 top-4 font-display text-[0.625rem] tracking-[0.3em] text-surface/50 md:left-5 md:top-5">
          KOKUBUNCHO AREA
        </p>
      </div>
      <figcaption className="mt-3 flex justify-between gap-4 text-[0.6875rem] text-surface/55">
        <span>遊栄ビジョン 設置拠点（イメージ図）</span>
        <span>※位置はイメージです</span>
      </figcaption>
    </figure>
  );
}

type PinProps = {
  venue: SignageVenue;
  index: number;
  count: number;
  progress: MotionValue<number>;
  active: boolean;
  onHighlight: (slug: string | null) => void;
};

function MapPin({ venue, index, count, progress, active, onHighlight }: PinProps) {
  const pos = PIN_POSITIONS[index % PIN_POSITIONS.length];
  // Pins light in order across 0.1 → 0.8 of the map's pass.
  const start = 0.1 + (index / Math.max(1, count)) * 0.6;
  const lit = useTransform(progress, [start, start + 0.1], [0, 1]);
  const dim = useTransform(lit, [0, 1], [0.3, 1]);
  const scale = useTransform(lit, [0, 1], [0.6, 1]);

  return (
    <div
      className="absolute"
      style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
      onPointerEnter={(e) => e.pointerType === "mouse" && onHighlight(venue.slug)}
      onPointerLeave={(e) => e.pointerType === "mouse" && onHighlight(null)}
    >
      <motion.div className="relative -translate-x-1/2 -translate-y-1/2" style={{ opacity: dim }}>
        <motion.span
          aria-hidden
          className="absolute left-1/2 top-1/2 size-16 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-sky/25 blur-md"
          style={{ opacity: lit }}
        />
        <motion.span aria-hidden className="relative block size-4 md:size-5" style={{ scale }}>
          <motion.span
            className="absolute inset-0 animate-ping rounded-full border-2 border-brand-sky [animation-duration:2.2s]"
            style={{ opacity: lit }}
          />
          <span
            className={cn(
              "absolute inset-0 rounded-full border-2 border-surface bg-brand-sky transition-transform duration-300",
              active && "scale-150",
            )}
          />
        </motion.span>
      </motion.div>
      <motion.span
        className={cn(
          "absolute flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[0.6875rem] font-bold transition-colors duration-300 md:px-3 md:py-1.5 md:text-sm",
          pos.side === "right" ? "left-4 top-0 -translate-y-1/2 md:left-5" : "left-0 top-4 -translate-x-1/2 md:top-5",
          active ? "bg-brand-sky text-brand-navy" : "bg-brand-navy/80 text-surface ring-1 ring-surface/15",
        )}
        style={{ opacity: dim }}
      >
        <span className={cn("font-display", active ? "text-brand-blue" : "text-brand-sky")}>{pad(index + 1)}</span>
        {venue.name}
      </motion.span>
    </div>
  );
}

type CardProps = {
  venue: SignageVenue;
  index: number;
  active: boolean;
  onHighlight: (slug: string | null) => void;
};

function VenueCard({ venue, index, active, onHighlight }: CardProps) {
  return (
    <Link
      href={`/business/signage/${venue.slug}`}
      onPointerEnter={(e) => e.pointerType === "mouse" && onHighlight(venue.slug)}
      onPointerLeave={(e) => e.pointerType === "mouse" && onHighlight(null)}
      onFocus={() => onHighlight(venue.slug)}
      onBlur={() => onHighlight(null)}
      className={cn(
        "group flex h-full flex-col overflow-hidden rounded-card bg-surface text-ink ring-2 ring-transparent transition-[box-shadow,transform] duration-300 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-sky",
        active && "ring-brand-sky md:-translate-y-1",
      )}
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        {venue.heroImage ? (
          <Image
            src={venue.heroImage}
            alt={`${venue.name}のビジョン`}
            fill
            sizes="(min-width: 768px) 25vw, 78vw"
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="bg-brand-gradient absolute inset-0 flex flex-col items-center justify-center gap-2 text-surface">
            <span aria-hidden className="font-display text-[0.625rem] tracking-[0.3em] text-brand-sky">
              YUEI VISION
            </span>
            <span className="text-sm font-bold tracking-[0.15em]">写真準備中</span>
          </div>
        )}
        <span className="absolute left-3 top-3 rounded-full bg-brand-navy/85 px-2.5 py-1 font-display text-[0.6875rem] tracking-[0.15em] text-brand-sky">
          {pad(index + 1)}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <p className="text-lg font-bold">{venue.name}</p>
        <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-muted [word-break:auto-phrase]">{venue.catchcopy}</p>
        <p className="mt-5 inline-flex items-center gap-2 text-xs font-bold tracking-[0.1em] text-brand-blue">
          詳しく見る
          <ArrowRight aria-hidden className="size-3.5 transition-transform group-hover:translate-x-1" />
        </p>
      </div>
    </Link>
  );
}
