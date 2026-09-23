import sharp from "sharp";
import path from "node:path";
import { mkdirSync } from "node:fs";

// Disable sharp's internal operation cache: on Windows it can keep file
// handles open briefly after toFile() resolves, which is surprising for a
// batch CLI that processes many files back-to-back.
sharp.cache(false);

export async function optimizeImage(
  src: string,
  outBase: string,
  opts: { maxEdge: number; quality?: number }
): Promise<string> {
  const out = `${outBase}.webp`;
  mkdirSync(path.dirname(out), { recursive: true });
  await sharp(src)
    .rotate()
    .resize({ width: opts.maxEdge, height: opts.maxEdge, fit: "inside", withoutEnlargement: true })
    .webp({ quality: opts.quality ?? 82 })
    .toFile(out);
  return out;
}
