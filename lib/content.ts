import path from "node:path";
import { createContentRepo } from "./content/repo";

export const content = createContentRepo(path.join(process.cwd(), "content"));
export type { Business, Venue, BusinessSlug } from "./content/schema";
