"use client";

import Image from "next/image";
import { useRef } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import { Breadcrumbs, type BreadcrumbItem } from "@/components/page/breadcrumbs";
import { TitleLines } from "@/components/page/title-lines";
import { titleParts } from "@/components/sections/business/title-parts";
import { useGated, useMotionActive } from "@/lib/effects/hooks";
import { MARK_PIECES, MARK_VIEWBOX, PILLAR_FACES, type Point } from "@/lib/brand/mark-geometry";

type Props = {
  name: string;
  /** `name` with "|" at the allowed line breaks (content `titleDisplay`). */
  titleDisplay?: string;
  nameEn?: string;
  category: string;
  catchcopy: string;
  /** Full-bleed photo. Without one, a brand-gradient "写真準備中" hero is shown. */
  image?: string;
  /** Latin label on the no-photo hero (e.g. "YUEI VISION"). */
  placeholderLabel: string;
  breadcrumbs: BreadcrumbItem[];
};

const toPoints = (pts: readonly Point[]) => pts.map(([x, y]) => `${x},${y}`).join(" ");

/**
 * Venue page hero: a full-bleed photo (≈85svh on phones, a full screen from
 * md) with a dark scrim at the bottom carrying white breadcrumbs, category,
 * the h1 and the catchcopy. The photo starts below the header band (the
 * site header is dark-on-transparent until the page scrolls, so it sits on
 * white rather than over the photo).
 *
 * Scrolling out, the photo settles from a slight push-in (zoom out) and
 * darkens while the copy lifts away. The h1 is the LCP element: rendered
 * fully visible, only scroll-linked transforms touch it. It is set as
 * unbreakable parts (break-keep) sized so a 7-character part fits a 320px
 * phone, so a name like 「ダイニングバー|暖家」 never breaks mid-word. Server/hydration/
 * reduced motion: static at the resting state.
 */
export function VenueHero({ name, titleDisplay, nameEn, category, catchcopy, image, placeholderLabel, breadcrumbs }: Props) {
  const ref = useRef<HTMLElement>(null);
  const active = useMotionActive();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const p = useGated(scrollYProgress, active, 0);

  const imageScale = useTransform(p, [0, 1], [1.08, 1]);
  const shade = useTransform(p, [0, 0.8], [0, 0.6]);
  const copyY = useTransform(p, [0, 1], [0, -80]);
  const copyOpacity = useTransform(p, [0.3, 0.8], [1, 0]);

  return (
    <section
      ref={ref}
      data-testid="venue-hero"
      aria-labelledby="venue-heading"
      className="h-[85svh] min-h-[34rem] bg-surface pt-16 md:h-svh md:min-h-[42rem] md:pt-20"
    >
      <div className="relative flex h-full flex-col justify-end overflow-hidden bg-brand-navy text-surface">
        <motion.div aria-hidden className="absolute inset-0 will-change-transform" style={{ scale: imageScale }}>
          {image ? (
            <Image src={image} alt="" fill preload sizes="100vw" className="object-cover object-[center_40%]" />
          ) : (
            <PlaceholderArt />
          )}
        </motion.div>

        {/* Scroll darkening. */}
        <motion.div aria-hidden className="absolute inset-0 bg-brand-navy" style={{ opacity: shade }} />
        {/* Bottom scrim for the white copy. */}
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-3/4 bg-linear-to-t from-brand-navy/90 via-brand-navy/45 to-transparent"
        />
        {/* Soft top shade so the photo meets the white header band cleanly. */}
        <div aria-hidden className="absolute inset-x-0 top-0 h-24 bg-linear-to-b from-brand-navy/40 to-transparent" />

        {!image && (
          // Outside the zoom layer so it never gets cropped at the edge.
          <div className="absolute right-5 top-6 flex flex-col items-end gap-2 md:right-8 md:top-8">
            <span aria-hidden className="font-display text-[0.625rem] tracking-[0.3em] text-brand-sky md:text-xs">
              {placeholderLabel}
            </span>
            <span className="rounded-full border border-surface/40 bg-brand-navy/30 px-3.5 py-1.5 text-xs font-bold tracking-[0.15em] text-surface backdrop-blur-sm">
              写真準備中
            </span>
          </div>
        )}

        <motion.div
          style={{ y: copyY, opacity: copyOpacity }}
          className="relative mx-auto w-full max-w-7xl px-5 pb-14 md:px-8 md:pb-20"
        >
          <Breadcrumbs
            items={breadcrumbs}
            className="mb-8 md:mb-10 [&_a:hover]:text-brand-sky [&_a]:focus-visible:outline-brand-sky [&_ol]:text-surface/75 [&_svg]:text-surface/50 [&_[aria-current]]:text-surface"
          />
          <p className="flex items-center gap-3 text-xs font-bold tracking-[0.2em] text-brand-sky md:text-sm">
            <span aria-hidden className="h-px w-8 bg-brand-sky/70" />
            {category}
          </p>
          <h1
            id="venue-heading"
            className="mt-4 break-keep text-[clamp(2rem,calc((100vw-2.5rem)/7.5),2.75rem)] font-bold leading-[1.15] [overflow-wrap:break-word] md:mt-5 md:text-7xl md:leading-[1.1] xl:text-8xl"
          >
            <TitleLines parts={titleParts(name, titleDisplay)} />
          </h1>
          {nameEn && (
            <p className="mt-3 font-display text-xs tracking-[0.3em] text-surface/70 md:text-sm">{nameEn}</p>
          )}
          <p className="mt-5 max-w-xl text-base leading-[1.9] text-surface/90 [word-break:auto-phrase] md:mt-6 md:text-lg">
            {catchcopy}
          </p>
        </motion.div>
      </div>
    </section>
  );
}

/** Brand-gradient stand-in for a venue without photos: the YUEI mark as line art. */
function PlaceholderArt() {
  const { x, y, width, height } = MARK_VIEWBOX;
  return (
    <div className="bg-brand-gradient absolute inset-0">
      {/* Fine dot grid. */}
      <div className="absolute inset-0 bg-[radial-gradient(var(--color-surface)_1px,transparent_1px)] bg-size-[24px_24px] opacity-15" />
      <svg
        viewBox={`${x - 4} ${y - 4} ${width + 8} ${height + 8}`}
        className="absolute right-[-18%] top-[12%] h-[62%] text-surface md:right-[6%] md:top-[14%] md:h-[72%]"
      >
        {PILLAR_FACES.map((f) => (
          <polygon
            key={f.name}
            points={toPoints(f.points)}
            fill="currentColor"
            fillOpacity={f.name === "top" ? 0.22 : 0.1}
            stroke="currentColor"
            strokeOpacity={0.45}
            strokeWidth={0.5}
          />
        ))}
        {MARK_PIECES.map((piece, i) => (
          <polygon
            key={i}
            points={toPoints(piece.points)}
            fill="currentColor"
            fillOpacity={0.08}
            stroke="currentColor"
            strokeOpacity={0.45}
            strokeWidth={0.5}
          />
        ))}
      </svg>
    </div>
  );
}
