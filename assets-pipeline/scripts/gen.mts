import { spawn } from "node:child_process";
import { readFileSync, mkdirSync } from "node:fs";
import { BriefSchema, StyleSchema, composePrompt, buildCodexArgs } from "./lib/brief";

// Usage: pnpm assets:gen <briefId> [<briefId>...]  (multiple ids run in parallel)
const root = process.cwd().replace(/\\/g, "/");
const ids = process.argv.slice(2);
if (ids.length === 0) {
  console.error("usage: pnpm assets:gen <briefId> [...]");
  process.exit(1);
}

const style = StyleSchema.parse(JSON.parse(readFileSync(`${root}/assets-pipeline/briefs/_style.json`, "utf8")));
const isWin = process.platform === "win32";
// On Windows `codex` is an npm .cmd shim, which needs a shell. The prompt goes
// through stdin, so the only arguments are flags and paths; quote any that
// contain whitespace so the shell does not split them.
const quote = (a: string) => (isWin && /\s/.test(a) ? `"${a}"` : a);

function run(id: string): Promise<number> {
  const brief = BriefSchema.parse(JSON.parse(readFileSync(`${root}/assets-pipeline/briefs/${id}.json`, "utf8")));
  const outDir = `${root}/assets-pipeline/generated/${id}`;
  mkdirSync(outDir, { recursive: true });
  const prompt = composePrompt(brief, style, outDir);
  const args = buildCodexArgs(root, `${outDir}/_last.txt`).map(quote);
  return new Promise((resolve) => {
    const child = spawn("codex", args, { stdio: ["pipe", "inherit", "inherit"], shell: isWin });
    child.on("error", (err) => {
      console.error(`[${id}] failed to start codex: ${err.message}`);
      resolve(1);
    });
    child.on("close", (code) => {
      console.log(`[${id}] codex exited with ${code}`);
      resolve(code ?? 1);
    });
    child.stdin.end(prompt, "utf8");
  });
}

const codes = await Promise.all(ids.map(run));
process.exit(codes.some((c) => c !== 0) ? 1 : 0);
