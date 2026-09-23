import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import type { z } from "zod";
import { BusinessSchema, VenueFrontmatterSchema, type Business, type BusinessSlug, type Venue } from "./schema";

function parseOrThrow<T>(schema: z.ZodType<T>, data: unknown, file: string): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new Error(`Invalid content in ${file}: ${result.error.message}`);
  }
  return result.data;
}

function listFiles(dir: string, ext: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((f) => f.endsWith(ext)).map((f) => path.join(dir, f));
}

const byOrder = <T extends { order: number }>(a: T, b: T) => a.order - b.order;

export function createContentRepo(root: string) {
  function getBusinesses(): Business[] {
    return listFiles(path.join(root, "businesses"), ".json")
      .map((file) => parseOrThrow(BusinessSchema, JSON.parse(fs.readFileSync(file, "utf8")), path.basename(file)))
      .sort(byOrder);
  }

  function getBusiness(slug: string): Business | undefined {
    return getBusinesses().find((b) => b.slug === slug);
  }

  function getVenues(business: Exclude<BusinessSlug, "digital">): Venue[] {
    return listFiles(path.join(root, "venues", business), ".mdx")
      .map((file) => {
        const { data, content } = matter(fs.readFileSync(file, "utf8"));
        const fm = parseOrThrow(VenueFrontmatterSchema, data, path.basename(file));
        return { ...fm, body: content };
      })
      .sort(byOrder);
  }

  function getVenue(business: Exclude<BusinessSlug, "digital">, slug: string): Venue | undefined {
    return getVenues(business).find((v) => v.slug === slug);
  }

  return { getBusinesses, getBusiness, getVenues, getVenue };
}
