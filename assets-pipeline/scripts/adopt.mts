import path from "node:path";
import sharp from "sharp";
import { readFileSync, writeFileSync, existsSync, renameSync } from "node:fs";
import { BRIEF_ID_RE, BriefSchema, StyleSchema, ManifestEntrySchema, parseVariant, recordAdoption } from "./lib/brief";
import { optimizeImage } from "./lib/optimize";

// Avoid lingering file handles on Windows in a one-shot CLI.
sharp.cache(false);

// Usage: pnpm assets:adopt <briefId> <vN>   e.g. v2
const [id, variant] = process.argv.slice(2);
if (!id || !BRIEF_ID_RE.test(id) || !/^v\d+$/.test(variant ?? "")) {
  console.error("usage: pnpm assets:adopt <briefId> <vN>  (briefId must match /^[a-z0-9-]+$/)");
  process.exit(1);
}

const root = path.resolve(import.meta.dirname, "../..");
const brief = BriefSchema.parse(JSON.parse(readFileSync(path.join(root, "assets-pipeline/briefs", `${id}.json`), "utf8")));
if (brief.id !== id) {
  console.error(`brief id "${brief.id}" does not match file name "${id}"`);
  process.exit(1);
}
if (parseVariant(variant, brief.variants) === null) {
  console.error(`variant ${variant} is out of range: ${id} has ${brief.variants} variant(s) (v1..v${brief.variants})`);
  process.exit(1);
}
const style = StyleSchema.parse(JSON.parse(readFileSync(path.join(root, "assets-pipeline/briefs/_style.json"), "utf8")));

const src = path.join(root, "assets-pipeline/generated", id, `${variant}.png`);
if (!existsSync(src)) {
  console.error(`not found: ${src}`);
  process.exit(1);
}

// Validate the manifest before producing any output.
const manifestPath = path.join(root, "assets-pipeline/manifest.json");
const manifest = ManifestEntrySchema.array().parse(JSON.parse(readFileSync(manifestPath, "utf8")));

const out = await optimizeImage(src, path.join(root, "public/images/generated", id), { maxEdge: 2560 });
const rel = path.relative(root, out).replace(/\\/g, "/");
const next = recordAdoption(manifest, brief, style, variant, rel, new Date().toISOString());
const tmp = `${manifestPath}.tmp`;
writeFileSync(tmp, JSON.stringify(next, null, 2) + "\n");
renameSync(tmp, manifestPath);
console.log(`adopted ${id} ${variant} -> ${rel}`);
