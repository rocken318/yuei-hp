import { describe, it, expect, afterEach } from "vitest";
import sharp from "sharp";
import path from "node:path";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { optimizeImage } from "@/assets-pipeline/scripts/lib/optimize";

// sharp keeps an internal operation cache that can hold file handles open on
// Windows just long enough to make an immediate rmSync of the temp dir throw
// EBUSY. Disable it for tests, which write and then immediately clean up.
sharp.cache(false);

const dirs: string[] = [];

function makeTmpDir() {
  const dir = mkdtempSync(path.join(tmpdir(), "opt-"));
  dirs.push(dir);
  return dir;
}

afterEach(() => {
  for (const dir of dirs.splice(0)) {
    // Small retry as a safety net on top of sharp.cache(false) above.
    rmSync(dir, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
  }
});

describe("optimizeImage", () => {
  it("長辺を maxEdge に縮小し webp で書き出す", async () => {
    const dir = makeTmpDir();
    const src = path.join(dir, "big.png");
    await sharp({ create: { width: 4000, height: 2000, channels: 3, background: "#0d3192" } }).png().toFile(src);

    const out = await optimizeImage(src, path.join(dir, "out/big"), { maxEdge: 2560 });

    expect(out).toBe(path.join(dir, "out/big.webp"));
    const meta = await sharp(out).metadata();
    expect(meta.format).toBe("webp");
    expect(meta.width).toBe(2560);
    expect(meta.height).toBe(1280);
  });

  it("小さい画像は拡大しない", async () => {
    const dir = makeTmpDir();
    const src = path.join(dir, "small.png");
    await sharp({ create: { width: 600, height: 600, channels: 3, background: "#ffffff" } }).png().toFile(src);
    const out = await optimizeImage(src, path.join(dir, "small"), { maxEdge: 2560 });
    expect((await sharp(out).metadata()).width).toBe(600);
  });
});
