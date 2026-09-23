import { z } from "zod";

export const businessSlugs = ["nightlife", "dining", "signage", "digital"] as const;
export type BusinessSlug = (typeof businessSlugs)[number];

export const BusinessSchema = z.object({
  slug: z.enum(businessSlugs),
  name: z.string().min(1),
  nameEn: z.string().min(1),
  brand: z.string().optional(),
  summary: z.string().min(1),
  heroImage: z.string().optional(),
  order: z.number().int(),
});
export type Business = z.infer<typeof BusinessSchema>;

export const VenueFrontmatterSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  business: z.enum(["nightlife", "dining", "signage"]),
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
