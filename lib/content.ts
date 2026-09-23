import "server-only";
import path from "node:path";
import { createContentRepo } from "./content/repo";

export const content = createContentRepo(path.join(process.cwd(), "content"));
export type { Business, Company, Venue, BusinessSlug, VenueBusinessSlug } from "./content/schema";
export { isVenueBusiness, venueBusinessSlugs } from "./content/schema";
export type { ContentRepo } from "./content/repo";
