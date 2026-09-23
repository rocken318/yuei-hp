import { z } from "zod";
import { TITLE_BREAK } from "./title-break";

export const businessSlugs = ["nightlife", "dining", "signage", "digital"] as const;
export type BusinessSlug = (typeof businessSlugs)[number];

const stripBreaks = (s: string) => s.split(TITLE_BREAK).join("");

export const BusinessSchema = z
  .object({
    slug: z.enum(businessSlugs),
    name: z.string().min(1),
    nameEn: z.string().min(1),
    brand: z.string().optional(),
    /** Latin form of `brand` (e.g. for display type). */
    brandEn: z.string().optional(),
    summary: z.string().min(1),
    heroImage: z.string().optional(),
    order: z.number().int(),
    /** Lead sentence for the business page. */
    lead: z.string().min(1).optional(),
    /** Body paragraphs for the business page. */
    description: z.array(z.string().min(1)).optional(),
    /** Service list (used by digital). */
    services: z.array(z.object({ title: z.string().min(1), body: z.string().min(1) })).optional(),
    /** Production flow steps (used by digital). */
    flow: z
      .array(z.object({ step: z.string().optional(), title: z.string().min(1), body: z.string().min(1) }))
      .optional(),
    /**
     * The displayed title (`brand ?? name`) with "|" at the allowed line breaks
     * of big headings; each part stays on one line (see titleParts).
     */
    titleDisplay: z.string().min(1).optional(),
  })
  .refine((b) => b.titleDisplay === undefined || stripBreaks(b.titleDisplay) === (b.brand ?? b.name), {
    message: "titleDisplay から | を除いた文字列は表示名（brand ?? name）と一致させてください",
    path: ["titleDisplay"],
  });
export type Business = z.infer<typeof BusinessSchema>;

export const venueBusinessSlugs = ["nightlife", "dining", "signage"] as const;
export type VenueBusinessSlug = (typeof venueBusinessSlugs)[number];

export function isVenueBusiness(s: string): s is VenueBusinessSlug {
  return (venueBusinessSlugs as readonly string[]).includes(s);
}

export const VenueFrontmatterSchema = z
  .object({
    slug: z.string().regex(/^[a-z0-9-]+$/),
    business: z.enum(venueBusinessSlugs),
    kind: z.enum(["store", "signage"]),
    name: z.string().min(1),
    nameEn: z.string().optional(),
    category: z.string().min(1),
    catchcopy: z.string().min(1),
    address: z.string().optional(),
    hours: z.string().optional(),
    closed: z.string().optional(),
    tel: z.string().optional(),
    mapUrl: z.url().optional(),
    siteUrl: z.url().optional(),
    sns: z
      .object({
        instagram: z.url().optional(),
        x: z.url().optional(),
        tiktok: z.url().optional(),
        line: z.url().optional(),
      })
      .default({}),
    heroImage: z.string().optional(),
    gallery: z.array(z.string()).default([]),
    order: z.number().int(),
    /** `name` with "|" at the allowed line breaks of the hero heading. */
    titleDisplay: z.string().min(1).optional(),
  })
  .refine((v) => v.titleDisplay === undefined || stripBreaks(v.titleDisplay) === v.name, {
    message: "titleDisplay から | を除いた文字列は name と一致させてください",
    path: ["titleDisplay"],
  });
export type Venue = z.infer<typeof VenueFrontmatterSchema> & { body: string };

export const CompanySchema = z.object({
  /** Registered (legal) name, e.g. "遊栄Japan株式会社". */
  name: z.string().min(1),
  /** Reading of `name` in katakana (without 株式会社). */
  nameKana: z.string().min(1).optional(),
  nameEn: z.string().min(1),
  /** 法人番号 (13 digits, National Tax Agency). */
  corporateNumber: z
    .string()
    .regex(/^\d{13}$/, "法人番号は13桁の数字で書いてください")
    .optional(),
  representative: z.string().optional(),
  established: z.string().optional(),
  capital: z.string().optional(),
  address: z.string().optional(),
  tel: z.string().optional(),
  employees: z.string().optional(),
  businessSummary: z.array(z.string().min(1)).optional(),
  history: z.array(z.object({ date: z.string().min(1), text: z.string().min(1) })).optional(),
  philosophy: z.object({ title: z.string().min(1), body: z.string().min(1) }).optional(),
  greeting: z
    .object({
      title: z.string().min(1),
      body: z.string().min(1),
      signature: z.string().optional(),
      /** Draft text: hidden in production (see lib/draft.ts). */
      draft: z.boolean().default(false),
    })
    .optional(),
});
export type Company = z.infer<typeof CompanySchema>;

export const newsCategories = ["お知らせ", "店舗", "採用", "メディア"] as const;
export type NewsCategory = (typeof newsCategories)[number];

/** Date → "YYYY-MM-DD" (UTC: YAML dates are parsed as UTC midnight). */
const isoDay = (d: Date) => d.toISOString().slice(0, 10);

/** A real calendar day written as "YYYY-MM-DD". */
const isValidDay = (s: string) => {
  const d = new Date(`${s}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && isoDay(d) === s;
};

export const NewsFrontmatterSchema = z.object({
  title: z.string().min(1),
  /**
   * Publication day, "YYYY-MM-DD". Unquoted YAML dates arrive as Date
   * objects (gray-matter) and are turned back into the same string.
   */
  date: z.preprocess(
    (v) => (v instanceof Date && !Number.isNaN(v.getTime()) ? isoDay(v) : v),
    z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "date は YYYY-MM-DD で書いてください")
      .refine(isValidDay, "date が実在する日付ではありません"),
  ),
  category: z.enum(newsCategories),
  /** Short summary for lists (optional). */
  excerpt: z.string().min(1).optional(),
});
/** A news item; `slug` is the file name without ".mdx". */
export type NewsItem = z.infer<typeof NewsFrontmatterSchema> & { slug: string; body: string };
