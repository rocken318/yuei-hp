import type { ReactNode } from "react";
import { SectionEyebrow } from "@/components/sections/home/section-eyebrow";
import { Breadcrumbs, type BreadcrumbItem } from "./breadcrumbs";
import { PageHeaderImage } from "./page-header-image";

type Props = {
  /** Latin label above the title (e.g. "ABOUT US"). */
  eyebrow: ReactNode;
  title: ReactNode;
  lead?: ReactNode;
  image?: { src: string; alt: string };
  breadcrumbs?: BreadcrumbItem[];
};

/**
 * Header for sub-pages: breadcrumbs, eyebrow, a large h1 and optional lead,
 * then an optional wide rounded image that drifts slowly with the scroll.
 * Clears the fixed site header (h-16 / md:h-20). The h1 is server-rendered
 * fully visible (it is the LCP candidate) — no entrance animation.
 * Long titles: lines break between phrases (auto-phrase, balanced), and a
 * single phrase wider than the column (e.g. "ナイトエンターテインメント" on
 * a 320px phone) still wraps (overflow-wrap: anywhere) instead of
 * overflowing; the grid columns are min-w-0 so they never grow past it.
 */
export function PageHeader({ eyebrow, title, lead, image, breadcrumbs }: Props) {
  return (
    <header data-testid="page-header" className="bg-surface pt-24 md:pt-32">
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        {breadcrumbs && breadcrumbs.length > 0 && <Breadcrumbs items={breadcrumbs} className="mb-8 md:mb-12" />}
        <SectionEyebrow>{eyebrow}</SectionEyebrow>
        <div className="mt-5 grid grid-cols-1 gap-6 md:mt-6 md:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] md:items-end md:gap-12">
          <h1 className="min-w-0 text-balance text-[2.25rem] font-bold leading-[1.25] text-ink [overflow-wrap:anywhere] [word-break:auto-phrase] md:text-6xl md:leading-[1.2]">
            {title}
          </h1>
          {lead && (
            <p className="min-w-0 max-w-xl text-sm leading-[2] text-ink-muted [word-break:auto-phrase] md:pb-2 md:text-base">
              {lead}
            </p>
          )}
        </div>
      </div>
      {image && (
        <div className="mx-auto mt-10 max-w-7xl px-5 md:mt-16 md:px-8">
          <PageHeaderImage src={image.src} alt={image.alt} />
        </div>
      )}
    </header>
  );
}
