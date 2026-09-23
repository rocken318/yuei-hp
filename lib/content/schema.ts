import { z } from "zod";

export const businessSlugs = ["nightlife", "dining", "signage", "digital"] as const;
export type BusinessSlug = (typeof businessSlugs)[number];

export const BusinessSchema = z.object({
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
});
export type Business = z.infer<typeof BusinessSchema>;

export const venueBusinessSlugs = ["nightlife", "dining", "signage"] as const;
export type VenueBusinessSlug = (typeof venueBusinessSlugs)[number];

export function isVenueBusiness(s: string): s is VenueBusinessSlug {
  return (venueBusinessSlugs as readonly string[]).includes(s);
}

export const VenueFrontmatterSchema = z.object({
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
});
export type Venue = z.infer<typeof VenueFrontmatterSchema> & { body: string };

export const CompanySchema = z.object({
  name: z.string().min(1),
  nameEn: z.string().min(1),
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
