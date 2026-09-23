"use client";

import Image, { getImageProps } from "next/image";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
  type ReactNode,
} from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useLenis } from "lenis/react";
import { ChevronLeft, ChevronRight, Expand, X } from "lucide-react";
import { clampIndex, snapIndex, stepOf, swipeDirection } from "@/lib/page/gallery";
import { duration, ease } from "@/lib/motion";
import { cn, pad2 } from "@/lib/utils";

export type GalleryImage = { src: string; alt: string };

type Props = {
  images: GalleryImage[];
  /** Accessible name of the gallery (e.g. "店内ギャラリー"). */
  label: string;
};

const THUMB_SIZES = "(min-width: 1024px) 34rem, (min-width: 768px) 60vw, 84vw";
/** Lightbox image sizes (also used to warm up the neighbouring photos). */
const LIGHTBOX_SIZES = "100vw";

/**
 * Photo gallery: a horizontal scroll-snap row (phones: the next photo peeks
 * in; md+: larger photos with previous/next buttons) and an "01 / 12"
 * counter. Tapping/clicking a photo opens it in a lightbox (native modal
 * <dialog>: the page behind is inert) with buttons, ←/→ keys and horizontal
 * swipes to move between photos; the previous/next photos are fetched ahead.
 * Esc, the close button or a tap on the stage (not on its buttons) closes it,
 * and focus returns to the row item of the photo shown LAST (open the 1st,
 * move to the 2nd, close → the 2nd item is focused and scrolled into view),
 * so keyboard users continue where they left off.
 * Reduced motion: no smooth scrolling and no image transitions.
 */
export function SwipeGallery({ images, label }: Props) {
  const reduced = useReducedMotion() ?? false;
  const lenis = useLenis();
  const rowRef = useRef<HTMLUListElement>(null);
  const thumbRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const swipeStart = useRef<{ x: number; y: number } | null>(null);
  /** Set by a swipe so the click that may follow it doesn't close the lightbox. */
  const swiped = useRef(false);
  /** Item a button-triggered smooth scroll is heading for (so rapid clicks add up). */
  const pendingTarget = useRef<number | null>(null);
  const count = images.length;

  const [index, setIndex] = useState(0);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(count <= 1);
  /** Image shown in the lightbox, or null while it is closed. */
  const [open, setOpen] = useState<number | null>(null);
  const [dir, setDir] = useState<1 | -1>(1);
  const isOpen = open !== null;

  const measure = useCallback(() => {
    const el = rowRef.current;
    if (!el) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    const step = stepOf(el);
    const target = pendingTarget.current;
    if (target !== null && (Math.abs(el.scrollLeft - Math.min(target * step, maxScroll)) < 2)) {
      pendingTarget.current = null;
    }
    setIndex(snapIndex({ scrollLeft: el.scrollLeft, maxScroll, step, count }));
    setAtStart(el.scrollLeft <= 2);
    setAtEnd(el.scrollLeft >= maxScroll - 2);
  }, [count]);

  useEffect(() => {
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [measure]);

  const scrollRow = (delta: 1 | -1) => {
    const el = rowRef.current;
    if (!el) return;
    const step = stepOf(el);
    const from = pendingTarget.current ?? snapIndex({ scrollLeft: el.scrollLeft, maxScroll: el.scrollWidth - el.clientWidth, step, count });
    const to = clampIndex(from + delta, count);
    pendingTarget.current = reduced ? null : to;
    el.scrollTo({ left: to * step, behavior: reduced ? "instant" : "smooth" });
  };

  const go = useCallback(
    (delta: 1 | -1) => {
      if (open === null) return;
      const next = clampIndex(open + delta, count);
      if (next === open) return;
      setDir(delta);
      setOpen(next);
    },
    [open, count],
  );

  // Show the native modal dialog when opened; lock the page scroll meanwhile
  // (Lenis drives it when mounted; `overflow` covers reduced motion).
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || !isOpen) return;
    if (!dialog.open) dialog.showModal();
    const root = document.documentElement;
    lenis?.stop();
    root.style.overflow = "hidden";
    return () => {
      lenis?.start();
      root.style.overflow = "";
    };
  }, [isOpen, lenis]);

  // Warm up the previous/next photos at the lightbox size (same srcset/sizes
  // as the <Image> below, so the browser picks the same candidate) so moving
  // on shows them without a blank frame.
  useEffect(() => {
    if (open === null) return;
    for (const i of [open - 1, open + 1]) {
      const img = images[i];
      if (!img) continue;
      const { props } = getImageProps({ src: img.src, alt: "", fill: true, sizes: LIGHTBOX_SIZES });
      const warm = new window.Image();
      if (props.sizes) warm.sizes = props.sizes;
      if (props.srcSet) warm.srcset = props.srcSet;
      warm.src = props.src;
    }
  }, [open, images]);

  const close = () => dialogRef.current?.close();

  // The dialog's "close" event (Esc, the close button, a tap on the stage) is the one place the state resets and focus returns to the row
  // item of the photo shown last (not necessarily the one first opened).
  const onDialogClose = () => {
    const last = open;
    setOpen(null);
    if (last === null) return;
    const thumb = thumbRefs.current[last];
    thumb?.focus({ preventScroll: true });
    thumb?.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "instant" });
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDialogElement>) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      go(1);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      go(-1);
    }
  };

  const onPointerDown = (e: PointerEvent) => {
    swipeStart.current = { x: e.clientX, y: e.clientY };
    swiped.current = false;
  };
  const onPointerUp = (e: PointerEvent) => {
    const start = swipeStart.current;
    swipeStart.current = null;
    if (!start) return;
    const d = swipeDirection(e.clientX - start.x, e.clientY - start.y);
    swiped.current = d !== 0;
    if (d !== 0) go(d);
  };
  // A tap that lands on the stage itself closes the lightbox — anywhere but
  // the prev/next buttons, since the photo layer is pointer-events-none —
  // unless the tap ended a swipe.
  const onStageClick = (e: MouseEvent<HTMLDivElement>) => {
    if (swiped.current) {
      swiped.current = false;
      return;
    }
    if (e.target === e.currentTarget) close();
  };

  if (count === 0) return null;
  const shown = open === null ? null : images[open];
  const offset = reduced ? 0 : 48;

  return (
    <div data-testid="swipe-gallery" role="group" aria-label={label}>
      <ul
        ref={rowRef}
        data-testid="gallery-row"
        onScroll={measure}
        // Direct manipulation cancels a button-triggered scroll target.
        onWheel={() => (pendingTarget.current = null)}
        onTouchStart={() => (pendingTarget.current = null)}
        className="-mx-5 flex snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain scroll-px-5 px-5 [scrollbar-width:none] md:mx-0 md:scroll-px-0 md:gap-5 md:px-0 [&::-webkit-scrollbar]:hidden"
      >
        {images.map((img, i) => (
          <li key={img.src} className="w-[84%] shrink-0 snap-start md:w-[60%] lg:w-[34rem]">
            <button
              ref={(el) => {
                thumbRefs.current[i] = el;
              }}
              type="button"
              onClick={() => {
                setDir(1);
                setOpen(i);
              }}
              aria-label={`${img.alt}（拡大表示）`}
              aria-haspopup="dialog"
              className="group relative block aspect-[4/3] w-full overflow-hidden rounded-card bg-surface-muted transition-transform duration-hover active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-blue md:active:scale-100"
            >
              <Image
                src={img.src}
                alt=""
                fill
                sizes={THUMB_SIZES}
                className="object-cover transition-transform duration-reveal group-hover:scale-105"
              />
              {/* Zoom cue: always shown on touch, on hover/focus with a mouse. */}
              <span
                aria-hidden
                className="absolute bottom-3 right-3 flex size-9 items-center justify-center rounded-full bg-brand-navy/70 text-surface transition-opacity duration-hover pointer-fine:opacity-0 pointer-fine:group-hover:opacity-100 pointer-fine:group-focus-visible:opacity-100"
              >
                <Expand className="size-4" />
              </span>
            </button>
          </li>
        ))}
      </ul>

      <div className="mt-5 flex min-h-11 items-center justify-between gap-4 md:mt-6">
        <p data-testid="gallery-counter" aria-hidden className="font-display text-xs tracking-[0.2em] text-ink-muted">
          <span className="text-ink">{pad2(index + 1)}</span> / {pad2(count)}
        </p>
        {count > 1 && (
          <div className="hidden items-center gap-2 md:flex">
            <RowButton label="前の写真へ" disabled={atStart} onClick={() => scrollRow(-1)}>
              <ChevronLeft aria-hidden className="size-5" />
            </RowButton>
            <RowButton label="次の写真へ" disabled={atEnd} onClick={() => scrollRow(1)}>
              <ChevronRight aria-hidden className="size-5" />
            </RowButton>
          </div>
        )}
      </div>

      <dialog
        ref={dialogRef}
        data-testid="lightbox"
        aria-label={`${label}（拡大表示）`}
        onClose={onDialogClose}
        onKeyDown={onKeyDown}
        className="fixed inset-0 m-0 size-full max-h-none max-w-none overflow-hidden bg-brand-navy p-0 text-surface backdrop:bg-brand-navy/80 open:flex open:flex-col"
      >
        {shown && open !== null && (
          <>
            <div className="flex items-center justify-between px-5 pb-3 pt-[max(1rem,env(safe-area-inset-top))] md:px-8 md:pt-6">
              <p data-testid="lightbox-counter" className="font-display text-sm tracking-[0.2em] text-surface/70">
                <span className="text-surface">{pad2(open + 1)}</span> / {pad2(count)}
              </p>
              <button
                type="button"
                onClick={close}
                aria-label="閉じる"
                className="flex size-11 items-center justify-center rounded-full bg-surface/10 transition-colors duration-hover hover:bg-surface/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-sky"
              >
                <X aria-hidden className="size-5" />
              </button>
            </div>

            <div
              data-testid="lightbox-stage"
              className="relative flex-1 touch-pan-y select-none overflow-hidden"
              onPointerDown={onPointerDown}
              onPointerUp={onPointerUp}
              onClick={onStageClick}
              onPointerCancel={() => {
                swipeStart.current = null;
              }}
            >
              <AnimatePresence initial={false} custom={dir}>
                <motion.div
                  key={open}
                  className="pointer-events-none absolute inset-x-4 bottom-20 top-2 md:inset-x-24 md:inset-y-2"
                  initial={reduced ? false : { opacity: 0, x: dir * offset }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -dir * offset }}
                  transition={{ duration: reduced ? 0 : duration.fast, ease: ease.out }}
                >
                  <Image src={shown.src} alt={shown.alt} fill sizes={LIGHTBOX_SIZES} className="object-contain" />
                </motion.div>
              </AnimatePresence>

              <LightboxButton side="left" label="前の写真" disabled={open === 0} onClick={() => go(-1)}>
                <ChevronLeft aria-hidden className="size-6" />
              </LightboxButton>
              <LightboxButton side="right" label="次の写真" disabled={open === count - 1} onClick={() => go(1)}>
                <ChevronRight aria-hidden className="size-6" />
              </LightboxButton>
            </div>

            <p
              aria-live="polite"
              className="px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3 text-center text-sm text-surface/80 md:px-8 md:pb-8"
            >
              {shown.alt}
            </p>
          </>
        )}
      </dialog>
    </div>
  );
}

type ButtonProps = { label: string; disabled: boolean; onClick: () => void; children: ReactNode };

function RowButton({ label, disabled, onClick, children }: ButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="flex size-11 items-center justify-center rounded-full border border-line text-ink transition-colors duration-hover hover:border-brand-blue hover:bg-brand-blue hover:text-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue disabled:pointer-events-none disabled:opacity-35"
    >
      {children}
    </button>
  );
}

function LightboxButton({ side, ...props }: ButtonProps & { side: "left" | "right" }) {
  return (
    <button
      type="button"
      aria-label={props.label}
      disabled={props.disabled}
      onClick={props.onClick}
      className={cn(
        "absolute bottom-4 flex size-12 items-center justify-center rounded-full bg-surface/10 text-surface transition-colors duration-hover hover:bg-surface/25 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-sky disabled:pointer-events-none disabled:opacity-30 md:bottom-auto md:top-1/2 md:-translate-y-1/2",
        side === "left" ? "left-5 md:left-6" : "right-5 md:right-6",
      )}
    >
      {props.children}
    </button>
  );
}
