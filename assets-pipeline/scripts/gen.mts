import path from "node:path";
import { spawn } from "node:child_process";
import { readFileSync, mkdirSync, readdirSync, rmSync, existsSync, createWriteStream, openSync, readSync, closeSync } from "node:fs";
import { BriefSchema, StyleSchema, composePrompt, buildCodexArgs } from "./lib/brief";
import { resolveCodexCommand, isPng, parseBriefIds, parseConcurrency, runPool } from "./lib/codex";

// Usage: pnpm assets:gen <briefId> [<briefId>...]
// Runs up to ASSETS_GEN_CONCURRENCY (default 2) codex sessions at a time.
// Each run's full output goes to assets-pipeline/generated/<id>/codex.log.
const root = path.resolve(import.meta.dirname, "../..").replace(/\\/g, "/");

const parsed = parseBriefIds(process.argv.slice(2));
if (!parsed.ok) {
  if (parsed.invalid.length) console.error(`invalid brief id(s): ${parsed.invalid.join(", ")} (must match /^[a-z0-9-]+$/)`);
  console.error("usage: pnpm assets:gen <briefId> [...]");
  process.exit(1);
}
const ids = parsed.ids;
const concurrency = parseConcurrency(process.env.ASSETS_GEN_CONCURRENCY);

/** Finds the npm `codex.cmd` shim on PATH (Windows only). */
function findCodexShim(): { dir: string; content: string } | null {
  for (const dir of (process.env.PATH ?? "").split(path.delimiter)) {
    if (!dir) continue;
    const file = path.join(dir, "codex.cmd");
    if (existsSync(file)) return { dir, content: readFileSync(file, "utf8") };
  }
  return null;
}

const codex = resolveCodexCommand(
  process.platform,
  process.platform === "win32" ? findCodexShim() : null,
  process.execPath
);
if (!codex) {
  console.error("could not locate the codex npm shim (codex.cmd) on PATH, or its JS entry could not be parsed");
  process.exit(1);
}
if (codex.prefixArgs[0] && !existsSync(codex.prefixArgs[0])) {
  console.error(`codex entry not found: ${codex.prefixArgs[0]}`);
  process.exit(1);
}

const style = StyleSchema.parse(JSON.parse(readFileSync(`${root}/assets-pipeline/briefs/_style.json`, "utf8")));

function readHead(file: string, n: number): Buffer {
  const fd = openSync(file, "r");
  try {
    const buf = Buffer.alloc(n);
    const read = readSync(fd, buf, 0, n, 0);
    return buf.subarray(0, read);
  } finally {
    closeSync(fd);
  }
}

async function run(id: string): Promise<number> {
  const started = Date.now();
  const tag = `[${id}]`;
  const fail = (msg: string) => {
    console.error(`${tag} fail: ${msg}`);
    return 1;
  };
  try {
    const brief = BriefSchema.parse(JSON.parse(readFileSync(`${root}/assets-pipeline/briefs/${id}.json`, "utf8")));
    if (brief.id !== id) return fail(`brief id "${brief.id}" does not match file name "${id}"`);

    const outDir = `${root}/assets-pipeline/generated/${id}`;
    mkdirSync(outDir, { recursive: true });
    // Remove stale outputs so a previous run's files can't pass verification.
    for (const f of readdirSync(outDir)) {
      if (/^v\d+\.png$/.test(f) || f === "_last.txt") rmSync(path.join(outDir, f), { force: true });
    }
    const expected = Array.from({ length: brief.variants }, (_, i) => `${outDir}/v${i + 1}.png`);
    const prompt = composePrompt(brief, style, outDir);
    const args = [...codex!.prefixArgs, ...buildCodexArgs(root, `${outDir}/_last.txt`)];
    const logFile = `${outDir}/codex.log`;
    const log = createWriteStream(logFile, { flags: "w" });

    console.log(`${tag} start (log: ${path.relative(root, logFile).replace(/\\/g, "/")})`);
    const code = await new Promise<number>((resolve) => {
      const child = spawn(codex!.command, args, { stdio: ["pipe", "pipe", "pipe"], shell: false, windowsHide: true });
      child.stdout.pipe(log, { end: false });
      child.stderr.pipe(log, { end: false });
      child.stdin.on("error", (err) => log.write(`\n[gen] stdin error: ${err.message}\n`));
      child.on("error", (err) => {
        log.write(`\n[gen] failed to start codex: ${err.message}\n`);
        resolve(-1);
      });
      child.on("close", (c) => resolve(c ?? 1));
      child.stdin.end(prompt, "utf8");
    });
    await new Promise<void>((r) => log.end(r));

    if (code === -1) return fail(`could not start codex (see ${logFile})`);
    if (code !== 0) return fail(`codex exited with ${code} (see ${logFile})`);
    const bad = expected.filter((f) => !existsSync(f) || !isPng(readHead(f, 8)));
    if (bad.length) return fail(`codex exited 0 but missing or invalid PNG: ${bad.map((f) => path.basename(f)).join(", ")} (see ${logFile})`);

    console.log(`${tag} done in ${((Date.now() - started) / 1000).toFixed(1)}s -> ${expected.length} file(s)`);
    return 0;
  } catch (err) {
    return fail(err instanceof Error ? err.message : String(err));
  }
}

const codes = await runPool(ids, concurrency, run);
process.exit(codes.some((c) => c !== 0) ? 1 : 0);
