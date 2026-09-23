import path from "node:path";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { BriefSchema, recordAdoption, type ManifestEntry } from "./lib/brief";
import { optimizeImage } from "./lib/optimize";

// Usage: pnpm assets:adopt <briefId> <vN>   e.g. v2
const [id, variant] = process.argv.slice(2);
if (!id || !/^v\d+$/.test(variant ?? "")) {
  console.error("usage: pnpm assets:adopt <briefId> <vN>");
  process.exit(1);
}

const root = process.cwd();
const src = path.join(root, "assets-pipeline/generated", id, `${variant}.png`);
if (!existsSync(src)) {
  console.error(`not found: ${src}`);
  process.exit(1);
}

const brief = BriefSchema.parse(JSON.parse(readFileSync(path.join(root, "assets-pipeline/briefs", `${id}.json`), "utf8")));
const out = await optimizeImage(src, path.join(root, "public/images/generated", id), { maxEdge: 2560 });
const manifestPath = path.join(root, "assets-pipeline/manifest.json");
const manifest: ManifestEntry[] = JSON.parse(readFileSync(manifestPath, "utf8"));
const next = recordAdoption(manifest, brief, variant, path.relative(root, out).replace(/\\/g, "/"), new Date().toISOString());
writeFileSync(manifestPath, JSON.stringify(next, null, 2) + "\n");
console.log(`adopted ${id} ${variant} -> ${path.relative(root, out)}`);
