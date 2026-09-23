import sharp from "sharp";
import path from "node:path";
import { mkdirSync } from "node:fs";

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
