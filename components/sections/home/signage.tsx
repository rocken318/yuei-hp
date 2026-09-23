"use client";

import Link from "next/link";
import { useCallback, useRef, useState, type UIEvent } from "react";
import { motion, useTransform, type MotionValue } from "motion/react";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { Reveal } from "@/components/effects/reveal";
import { useGated, useMotionActive } from "@/lib/effects/hooks";
import { useStableScroll } from "@/lib/effects/stable-scroll";
import { stepOf } from "@/lib/page/gallery";
import { cn, pad2 } from "@/lib/utils";
import { VenueCard } from "@/components/page/venue-card";
import { SectionEyebrow } from "./section-eyebrow";
import type { Venue } from "@/lib/content/schema";
import {
  ALL_STREETS,
  MAP_HEADER,
  MAP_VIEWBOX,
  STREETS,
  STREET_LABELS,
  pctX,
  pctY,
  pinFor,
} from "./signage-map";

export type SignageVenue = Pick<Venue, "slug" | "name" | "catchcopy" | "heroImage">;

type Props = { venues: SignageVenue[] };

/**
 * Home §5 — 遊栄ビジョン. A sketch map of the district (geometry in ./signage-map) whose pins light up one by
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
  const scrollYProgress = useStableScroll(mapRef, ["start 85%", "end 45%"]);
  // Server/hydration/reduced motion: 1 (= every pin lit, scan finished).
  const p = useGated(scrollYProgress, active, 1);
  const scanTop = useTransform(p, [0, 0.9], ["0%", "100%"]);
  const scanOpacity = useTransform(p, [0, 0.06, 0.8, 0.92], [0, 1, 1, 0]);

  // On touch the cards are swiped: follow the snapped card with the pin
  // highlight and the "01 / 04" counter (the hover sync's touch alternative).
  const onSwipe = useCallback(
    (e: UIEvent<HTMLUListElement>) => {
      const el = e.currentTarget;
      if (el.scrollWidth <= el.clientWidth) return;
      const step = stepOf(el);
      if (step === 0) return;
      const i = Math.min(venues.length - 1, Math.max(0, Math.round(el.scrollLeft / step)));
      setSwipeIndex(i);
      setHighlight(venues[i]?.slug ?? null);
    },
    [venues],
  );

  return (
    <section
      data-testid="signage"
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
            <SectionEyebrow tone="onDark">
              YUEI VISION
              <span className="font-sans tracking-[0.15em] text-surface/60">デジタルサイネージ事業</span>
            </SectionEyebrow>
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
            <p
              data-testid="signage-counter"
              aria-hidden
              className="font-display text-xs tracking-[0.2em] text-surface/60 md:hidden"
            >
              <span className="text-surface">{pad2(swipeIndex + 1)}</span> / {pad2(venues.length)}
            </p>
          </div>
          <ul
            data-testid="signage-cards"
            onScroll={onSwipe}
            className="-mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain scroll-px-5 px-5 pb-2 [scrollbar-width:none] md:mx-0 md:grid md:grid-cols-4 md:gap-6 md:overflow-visible md:px-0 md:pb-0 [&::-webkit-scrollbar]:hidden"
          >
            {venues.map((v, i) => (
              <li key={v.slug} className="w-[78%] shrink-0 snap-start sm:w-[45%] md:w-auto">
                <Reveal delay={i * 0.08} className="h-full">
                  <VenueCard
                    href={`/business/signage/${v.slug}`}
                    name={v.name}
                    catchcopy={v.catchcopy}
                    image={v.heroImage}
                    index={i}
                    tone="onDark"
                    placeholderLabel="YUEI VISION"
                    highlighted={highlight === v.slug}
                    onHighlightChange={(on) => setHighlight(on ? v.slug : null)}
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

const { width: W, height: H } = MAP_VIEWBOX;
const X_EDGES = [0, ...ALL_STREETS.filter((s) => s.axis === "x").map((s) => s.at), W].sort((a, b) => a - b);
const Y_EDGES = [MAP_HEADER, ...ALL_STREETS.filter((s) => s.axis === "y").map((s) => s.at), H].sort((a, b) => a - b);

const streetPath = (axis: "x" | "y", at: number) => (axis === "x" ? `M${at} ${MAP_HEADER}V${H}` : `M0 ${at}H${W}`);

/** Grid, city blocks and streets (decorative SVG, stretched to the 4:3 box). */
function StreetGrid() {
  return (
    <svg aria-hidden viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="absolute inset-0 size-full">
      <defs>
        <pattern id="signage-grid" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M20 0H0V20" fill="none" className="stroke-surface/[0.05]" strokeWidth="1" />
        </pattern>
      </defs>
      <rect width={W} height={H} fill="url(#signage-grid)" />
      {/* City blocks between the streets. */}
      <g className="fill-surface/[0.035]">
        {X_EDGES.slice(1).flatMap((x, xi) =>
          Y_EDGES.slice(1).map((y, yi) => {
            const x0 = X_EDGES[xi];
            const y0 = Y_EDGES[yi];
            return <rect key={`${xi}-${yi}`} x={x0 + 7} y={y0 + 7} width={x - x0 - 14} height={y - y0 - 14} rx="4" />;
          }),
        )}
      </g>
      {/* Side streets. */}
      <g className="stroke-surface/15" strokeWidth="1.5" fill="none">
        {ALL_STREETS.filter((s) => s.weight === "minor").map((s) => (
          <path key={s.id} d={streetPath(s.axis, s.at)} />
        ))}
      </g>
      {/* Avenues. */}
      <g className="stroke-brand-sky/35" strokeWidth="4" fill="none" strokeLinecap="round">
        {ALL_STREETS.filter((s) => s.weight === "major").map((s) => (
          <path key={s.id} d={streetPath(s.axis, s.at)} />
        ))}
      </g>
      {/* 国分町通り — the main street. */}
      <path
        d={streetPath(STREETS.kokubuncho.axis, STREETS.kokubuncho.at)}
        className="stroke-brand-sky/70"
        strokeWidth="6"
        fill="none"
      />
    </svg>
  );
}

/** Street names (HTML so the text stays crisp and unstretched). */
function StreetLabels() {
  return (
    <>
      <p
        className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap font-display text-[0.5625rem] tracking-[0.3em] text-surface/45 md:text-[0.625rem]"
        style={{ top: pctY(MAP_HEADER / 2) }}
      >
        KOKUBUNCHO AREA
      </p>
      {STREET_LABELS.map(({ id, x, y }) => {
        const street = STREETS[id];
        const main = street.weight === "main";
        return (
          <p
            key={id}
            className={cn(
              "absolute -translate-x-1/2 -translate-y-1/2 whitespace-nowrap text-[0.5625rem] leading-none tracking-[0.12em] md:text-[0.6875rem]",
              street.axis === "y" && "rounded-sm bg-brand-navy px-1.5 py-1",
              main ? "font-bold text-brand-sky" : "text-surface/70",
            )}
            style={{ left: pctX(x), top: pctY(y) }}
          >
            {street.label}
          </p>
        );
      })}
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
        <StreetGrid />
        <StreetLabels />

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

      </div>
      <figcaption className="mt-3 flex justify-between gap-4 text-[0.6875rem] text-surface/55">
        <span>遊栄ビジョン 設置拠点（イメージ図）</span>
        <span>※位置はイメージです</span>
      </figcaption>
    </figure>
  );
}

const LABEL_SIDE = {
  right: "left-4 top-0 -translate-y-1/2 md:left-5",
  below: "left-0 top-4 -translate-x-1/2 md:top-5",
  // The wrapper is as tall as the pin (its centre is the wrapper top), hence
  // the larger offset: ~8px clear of the pin.
  above: "bottom-8 left-0 -translate-x-1/2 md:bottom-10",
  // A second row above "above" labels, for a pin between two neighbours on
  // the same street (see signage-map). Joined to the pin by LEADER.
  raised: "bottom-16 left-0 -translate-x-1/2 md:bottom-[4.5rem] lg:bottom-20",
} as const;

/** Leader line from the pin's top edge up to a "raised" label. */
const LEADER = "bottom-6 h-10 md:bottom-[1.875rem] md:h-[2.625rem] lg:h-[3.125rem]";

type PinProps = {
  venue: SignageVenue;
  index: number;
  count: number;
  progress: MotionValue<number>;
  active: boolean;
  onHighlight: (slug: string | null) => void;
};

function MapPin({ venue, index, count, progress, active, onHighlight }: PinProps) {
  const pos = pinFor(venue.slug, index);
  // Pins light in order across 0.1 → 0.8 of the map's pass.
  const start = 0.1 + (index / Math.max(1, count)) * 0.6;
  const lit = useTransform(progress, [start, start + 0.1], [0, 1]);
  const dim = useTransform(lit, [0, 1], [0.3, 1]);
  const scale = useTransform(lit, [0, 1], [0.6, 1]);

  // Decorative: the venues are listed (as links) in the cards below.
  return (
    <div
      aria-hidden
      className="absolute"
      style={{ left: pctX(pos.x), top: pctY(pos.y) }}
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
            className="absolute inset-0 animate-pulse-ring rounded-full border-2 border-brand-sky"
            style={{ opacity: lit }}
          />
          <span
            className={cn(
              "absolute inset-0 rounded-full border-2 border-surface bg-brand-sky transition-transform duration-hover",
              active && "scale-150",
            )}
          />
        </motion.span>
      </motion.div>
      {pos.side === "raised" && (
        <motion.span
          className={cn("absolute left-0 w-px -translate-x-1/2 bg-brand-sky/50", LEADER)}
          style={{ opacity: dim }}
        />
      )}
      <motion.span
        className={cn(
          "absolute flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[0.6875rem] font-bold transition-colors duration-hover lg:px-3 lg:py-1.5 lg:text-sm",
          LABEL_SIDE[pos.side],
          active ? "bg-brand-sky text-brand-navy" : "bg-brand-navy/80 text-surface ring-1 ring-surface/15",
        )}
        style={{ opacity: dim }}
      >
        <span className={cn("font-display", active ? "text-brand-blue" : "text-brand-sky")}>{pad2(index + 1)}</span>
        {venue.name}
      </motion.span>
    </div>
  );
}
