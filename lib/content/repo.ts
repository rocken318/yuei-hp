import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import { z } from "zod";
import {
  BusinessSchema,
  VenueFrontmatterSchema,
  type Business,
  type Venue,
  type VenueBusinessSlug,
} from "./schema";

export interface ContentRepo {
  getBusinesses(): Promise<Business[]>;
  getBusiness(slug: string): Promise<Business | undefined>;
  getVenues(business: VenueBusinessSlug): Promise<Venue[]>;
  getVenue(business: VenueBusinessSlug, slug: string): Promise<Venue | undefined>;
}

function parseOrThrow<T>(schema: z.ZodType<T>, data: unknown, file: string): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new Error(`Invalid content in ${file}: ${z.prettifyError(result.error)}`);
  }
  return result.data;
}

function wrapParseError(file: string, err: unknown): never {
  const message = err instanceof Error ? err.message : String(err);
  throw new Error(`Invalid content in ${file}: ${message}`);
}

async function listFiles(dir: string, ext: string): Promise<string[]> {
  try {
    const entries = await fs.readdir(dir);
    return entries.filter((f) => f.endsWith(ext)).map((f) => path.join(dir, f));
  } catch (err) {
    if (err instanceof Error && "code" in err && (err as NodeJS.ErrnoException).code === "ENOENT") {
      return [];
    }
    throw err;
  }
}

const byOrder = <T extends { order: number }>(a: T, b: T) => a.order - b.order;

export function createContentRepo(root: string): ContentRepo {
  async function getBusinesses(): Promise<Business[]> {
    const files = await listFiles(path.join(root, "businesses"), ".json");
    const businesses = await Promise.all(
      files.map(async (file) => {
        const raw = await fs.readFile(file, "utf8");
        let data: unknown;
        try {
          data = JSON.parse(raw);
        } catch (err) {
          wrapParseError(path.basename(file), err);
        }
        return parseOrThrow(BusinessSchema, data, path.basename(file));
      }),
    );
    return businesses.sort(byOrder);
  }

  async function getBusiness(slug: string): Promise<Business | undefined> {
    const businesses = await getBusinesses();
    return businesses.find((b) => b.slug === slug);
  }

  async function getVenues(business: VenueBusinessSlug): Promise<Venue[]> {
    const files = await listFiles(path.join(root, "venues", business), ".mdx");
    const venues = await Promise.all(
      files.map(async (file) => {
        const raw = await fs.readFile(file, "utf8");
        const fileName = path.basename(file);
        let parsed: { data: unknown; content: string };
        try {
          parsed = matter(raw);
        } catch (err) {
          wrapParseError(fileName, err);
        }
        const { data, content } = parsed;
        const fm = parseOrThrow(VenueFrontmatterSchema, data, fileName);
        if (fm.business !== business) {
          throw new Error(
            `Invalid content in ${fileName}: frontmatter business "${fm.business}" does not match directory business "${business}"`,
          );
        }
        const expectedSlug = fileName.endsWith(".mdx") ? fileName.slice(0, -".mdx".length) : fileName;
        if (fm.slug !== expectedSlug) {
          throw new Error(
            `Invalid content in ${fileName}: frontmatter slug "${fm.slug}" does not match file name "${expectedSlug}"`,
          );
        }
        return { ...fm, body: content };
      }),
    );
    return venues.sort(byOrder);
  }

  async function getVenue(business: VenueBusinessSlug, slug: string): Promise<Venue | undefined> {
    const venues = await getVenues(business);
    return venues.find((v) => v.slug === slug);
  }

  return { getBusinesses, getBusiness, getVenues, getVenue };
}
