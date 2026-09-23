import path from "node:path";
import sharp from "sharp";
import { readFileSync, existsSync } from "node:fs";
import { optimizeImage } from "./lib/optimize";

// Disable sharp's operation cache: on Windows it can keep file handles open
// briefly after toFile() resolves, which is surprising for a batch CLI.
sharp.cache(false);

const root = path.resolve(import.meta.dirname, "../..");
const map: { src: string; out: string }[] = JSON.parse(
  readFileSync(path.join(root, "assets-pipeline/source-map.json"), "utf8")
);

let failed = 0;
for (const entry of map) {
  const src = path.join(root, "images", entry.src);
  if (!existsSync(src)) {
    console.error(`missing: ${entry.src}`);
    failed++;
    continue;
  }
  const out = await optimizeImage(src, path.join(root, "public/images/source", entry.out), { maxEdge: 2560 });
  console.log(`ok: ${entry.src} -> ${path.relative(root, out)}`);
}
if (failed) process.exit(1);
