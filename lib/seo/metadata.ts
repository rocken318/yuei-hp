import type { Metadata } from "next";
import { SITE_NAME } from "@/lib/site";

export const OG_IMAGE_ALT = "遊栄Japan株式会社 — 国分町の夜から、街の未来へ。";

/**
 * The site-wide share image (app/opengraph-image.tsx). A page that sets its
 * own `openGraph` replaces the parent's whole block — images included — so
 * pages list it explicitly.
 */
export const DEFAULT_OG_IMAGE = {
  url: "/opengraph-image",
  width: 1200,
  height: 630,
  alt: OG_IMAGE_ALT,
  type: "image/png",
} as const;

/** Open Graph fields every page shares. */
export const OG_BASE = { siteName: SITE_NAME, locale: "ja_JP", type: "website" } as const;

/**
 * Metadata for a page at `path`: title/description, canonical URL and an
 * Open Graph block with the page URL and the share image. og:title /
 * og:description and the twitter card's title/description/image are filled
 * by Next from the page title/description and og:image (the root layout sets
 * `twitter.card`).
 */
export function pageMetadata({
  title,
  description,
  path,
}: {
  title?: string;
  description?: string;
  path: string;
}): Metadata {
  return {
    ...(title !== undefined && { title }),
    ...(description !== undefined && { description }),
    alternates: { canonical: path },
    openGraph: { ...OG_BASE, url: path, images: [DEFAULT_OG_IMAGE] },
  };
}
