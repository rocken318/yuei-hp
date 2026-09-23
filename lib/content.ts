import "server-only";
import path from "node:path";
import { createContentRepo } from "./content/repo";

export const content = createContentRepo(path.join(process.cwd(), "content"));
export type { Business, Company, Venue, BusinessSlug, VenueBusinessSlug, NewsItem, NewsCategory } from "./content/schema";
export { isVenueBusiness, venueBusinessSlugs, newsCategories } from "./content/schema";
export type { ContentRepo } from "./content/repo";
