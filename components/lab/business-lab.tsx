"use client";

import Link from "next/link";
import { useSyncExternalStore, type MouseEvent, type ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useLenis } from "lenis/react";
import { SectionEyebrow } from "@/components/sections/home/section-eyebrow";
import { cn } from "@/lib/utils";
import { LAB_VARIANTS, parseVariant, type LabVariantId } from "./business-variants/variants";

type Slots = Record<LabVariantId, ReactNode>;

type Props = {
  /** One rendered variant per id (built on the server). */
  slots: Slots;
  /** Content after the variant (marquee, next-section stand-in), to judge the scroll-out. */
  after: ReactNode;
};

const noSubscribe = () => () => {};

/**
 * The lab, reading the variant from `?v=`. Wrap in <Suspense>.
 *
 * The page is force-static, so its HTML is prerendered without search
 * params: the server (and hydration) render the frame without a variant,
 * and the variant mounts right after hydration. Rendering it from `?v=`
 * during hydration would not match the prerendered HTML.
 */
export function BusinessLab(props: Props) {
  const params = useSearchParams();
  const hydrated = useSyncExternalStore(noSubscribe, () => true, () => false);
  return <BusinessLabFrame {...props} variant={hydrated ? parseVariant(params.get("v")) : null} />;
}

/**
 * Lab frame: the variant switcher (sticky under the site header), an intro
 * with the variant's caption, the variant itself and the content after it.
 * `variant` null renders the frame only (Suspense fallback of the static page).
 */
export function BusinessLabFrame({ slots, after, variant }: Partial<Props> & { variant: LabVariantId | null }) {
  const meta = LAB_VARIANTS.find((v) => v.id === variant);
  return (
    // --lab-bar: height of the sticky switcher; pinned variants clear it
    // (plus the header) so their content is not hidden under the lab chrome.
    <div className="[--lab-bar:3.25rem] pt-16 md:[--lab-bar:3.5rem] md:pt-20">
      <Switcher current={variant} />

      <div className="mx-auto flex min-h-[62svh] max-w-7xl flex-col justify-center px-5 py-16 md:min-h-[70svh] md:px-8">
        <SectionEyebrow>SCROLL LAB</SectionEyebrow>
        <h1 className="mt-3 text-3xl leading-tight font-bold text-ink md:mt-4 md:text-5xl">
          事業紹介のスクロール表現
        </h1>
        <p className="mt-2 text-sm text-ink-muted">社内確認用のページです（本番環境では表示されません）。</p>
        {meta ? (
          <div className="mt-8 max-w-2xl border-l-2 border-brand-blue pl-4 md:mt-10 md:pl-6">
            <p className="font-heading text-lg font-bold text-ink md:text-2xl">{meta.name}</p>
            <p className="mt-2 text-sm leading-relaxed text-ink-muted [word-break:auto-phrase] md:text-base md:leading-loose">
              {meta.caption}
            </p>
          </div>
        ) : null}
        <p className="mt-10 font-display text-xs tracking-[0.3em] text-ink-muted" aria-hidden="true">
          SCROLL ↓
        </p>
      </div>

      {variant && slots ? <div key={variant}>{slots[variant]}</div> : null}
      {after}
    </div>
  );
}

function Switcher({ current }: { current: LabVariantId | null }) {
  const router = useRouter();
  const pathname = usePathname();
  const lenis = useLenis();

  const select = (e: MouseEvent<HTMLAnchorElement>, id: LabVariantId) => {
    // Let modified clicks (new tab…) through to the plain link.
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    e.preventDefault();
    if (lenis) lenis.scrollTo(0, { immediate: true, force: true });
    else window.scrollTo({ top: 0, behavior: "instant" });
    router.replace(`${pathname}?v=${id}`, { scroll: false });
  };

  return (
    <nav
      aria-label="表現バリエーション"
      className="sticky top-16 z-40 flex h-[var(--lab-bar)] items-center border-b border-line bg-surface/85 backdrop-blur-md md:top-20"
    >
      <ol className="mx-auto grid w-full max-w-3xl grid-cols-5 gap-1 px-3 md:px-8">
        {LAB_VARIANTS.map((v) => {
          const selected = v.id === current;
          return (
            <li key={v.id}>
              <Link
                href={`?v=${v.id}`}
                scroll={false}
                onClick={(e) => select(e, v.id)}
                aria-current={selected ? "page" : undefined}
                className={cn(
                  "flex h-9 flex-col items-center justify-center rounded-full leading-none transition-colors duration-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue md:h-10 md:flex-row md:gap-2",
                  selected ? "bg-brand-blue text-surface" : "text-ink hover:bg-surface-muted",
                )}
              >
                <span className="font-display text-xs font-bold md:text-sm">{v.id.toUpperCase()}</span>
                <span className="mt-0.5 text-[0.625rem] whitespace-nowrap md:mt-0 md:text-xs">{v.label}</span>
              </Link>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
