import { BRIEF_ID_RE } from "./brief";

export type CodexCommand = { command: string; prefixArgs: string[] };

/**
 * Extracts the JS entry (relative to the shim's directory, "/"-separated) from
 * an npm-generated `.cmd` shim, e.g. `"%dp0%\node_modules\@openai\codex\bin\codex.js" %*`.
 */
export function parseCmdShimTarget(content: string): string | null {
  const m = /"%dp0%\\([^"%]+\.(?:c|m)?js)"\s+%\*/i.exec(content);
  return m ? m[1].replace(/\\/g, "/") : null;
}

/**
 * How to launch codex without a shell. On Windows `codex` is an npm `.cmd`
 * shim that can only be run through cmd.exe; instead we run its JS entry with
 * the current Node binary. Returns null on win32 when the shim is missing or
 * unrecognized (the caller should fail rather than fall back to a shell).
 */
export function resolveCodexCommand(
  platform: NodeJS.Platform,
  shim: { dir: string; content: string } | null,
  execPath: string
): CodexCommand | null {
  if (platform !== "win32") return { command: "codex", prefixArgs: [] };
  if (!shim) return null;
  const target = parseCmdShimTarget(shim.content);
  if (!target) return null;
  const dir = shim.dir.replace(/\\/g, "/").replace(/\/+$/, "");
  return { command: execPath, prefixArgs: [`${dir}/${target}`] };
}

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

export function isPng(buf: Uint8Array): boolean {
  return buf.length >= PNG_SIGNATURE.length && PNG_SIGNATURE.every((b, i) => buf[i] === b);
}

export type ParsedIds = { ok: true; ids: string[] } | { ok: false; invalid: string[] };

/** Validates CLI brief ids against BRIEF_ID_RE and de-duplicates them (order kept). */
export function parseBriefIds(args: string[]): ParsedIds {
  const invalid = args.filter((a) => !BRIEF_ID_RE.test(a));
  if (args.length === 0 || invalid.length > 0) return { ok: false, invalid };
  return { ok: true, ids: [...new Set(args)] };
}

export function parseConcurrency(value: string | undefined, fallback = 2): number {
  if (!value || !/^\d+$/.test(value)) return fallback;
  const n = Number(value);
  return n >= 1 ? n : fallback;
}

/** Runs fn over items with at most `limit` in flight; results keep input order. */
export async function runPool<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results = new Array<R>(items.length);
  let next = 0;
  const worker = async () => {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i]);
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}
