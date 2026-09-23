import { describe, it, expect } from "vitest";
import {
  parseCmdShimTarget,
  resolveCodexCommand,
  isPng,
  parseBriefIds,
  parseConcurrency,
  runPool,
} from "@/assets-pipeline/scripts/lib/codex";

const SHIM = [
  "@ECHO off",
  "GOTO start",
  ":find_dp0",
  "SET dp0=%~dp0",
  "EXIT /b",
  ":start",
  "SETLOCAL",
  "CALL :find_dp0",
  "",
  String.raw`IF EXIST "%dp0%\node.exe" (`,
  String.raw`  SET "_prog=%dp0%\node.exe"`,
  ") ELSE (",
  '  SET "_prog=node"',
  "  SET PATHEXT=%PATHEXT:;.JS;=;%",
  ")",
  "",
  String.raw`endLocal & goto #_undefined_# 2>NUL || title %COMSPEC% & "%_prog%"  "%dp0%\node_modules\@openai\codex\bin\codex.js" %*`,
].join("\r\n");

describe("codex command resolution", () => {
  it("npm の .cmd シムから JS エントリを取り出す", () => {
    expect(parseCmdShimTarget(SHIM)).toBe("node_modules/@openai/codex/bin/codex.js");
    expect(parseCmdShimTarget("@echo off\r\nsomething.exe %*")).toBeNull();
  });

  it("win32 ではシムの JS を process.execPath で直接起動する（shell なし）", () => {
    expect(
      resolveCodexCommand("win32", { dir: "C:/Users/u/AppData/Roaming/npm", content: SHIM }, "C:/node/node.exe")
    ).toEqual({
      command: "C:/node/node.exe",
      prefixArgs: ["C:/Users/u/AppData/Roaming/npm/node_modules/@openai/codex/bin/codex.js"],
    });
  });

  it("win32 でシムが見つからない/解析できない場合は null", () => {
    expect(resolveCodexCommand("win32", null, "node.exe")).toBeNull();
    expect(resolveCodexCommand("win32", { dir: "C:/npm", content: "garbage" }, "node.exe")).toBeNull();
  });

  it("win32 以外は codex をそのまま起動する", () => {
    expect(resolveCodexCommand("linux", null, "/usr/bin/node")).toEqual({ command: "codex", prefixArgs: [] });
    expect(resolveCodexCommand("darwin", null, "/usr/bin/node")).toEqual({ command: "codex", prefixArgs: [] });
  });
});

describe("isPng", () => {
  it("PNG シグネチャで始まるバッファだけ true", () => {
    const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    expect(isPng(Buffer.concat([sig, Buffer.from([0, 0, 0, 13])]))).toBe(true);
    expect(isPng(sig.subarray(0, 7))).toBe(false);
    expect(isPng(Buffer.from("not a png at all"))).toBe(false);
    expect(isPng(Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0]))).toBe(false);
  });
});

describe("parseBriefIds", () => {
  it("重複を除き順序を保つ", () => {
    expect(parseBriefIds(["a", "b-1", "a"])).toEqual({ ok: true, ids: ["a", "b-1"] });
  });

  it("不正な id を拒否する", () => {
    expect(parseBriefIds(["ok", "bad/id"])).toEqual({ ok: false, invalid: ["bad/id"] });
    expect(parseBriefIds(["..\\x", "A", 'x"&calc'])).toEqual({ ok: false, invalid: ["..\\x", "A", 'x"&calc'] });
  });

  it("空は拒否する", () => {
    expect(parseBriefIds([])).toEqual({ ok: false, invalid: [] });
  });
});

describe("parseConcurrency", () => {
  it("既定は 2、正の整数だけ受け付ける", () => {
    expect(parseConcurrency(undefined)).toBe(2);
    expect(parseConcurrency("")).toBe(2);
    expect(parseConcurrency("4")).toBe(4);
    expect(parseConcurrency("0")).toBe(2);
    expect(parseConcurrency("-1")).toBe(2);
    expect(parseConcurrency("abc")).toBe(2);
    expect(parseConcurrency("1.5")).toBe(2);
  });
});

describe("runPool", () => {
  it("同時実行数を制限し、入力順で結果を返す", async () => {
    let active = 0;
    let peak = 0;
    const results = await runPool([30, 10, 20, 5, 15], 2, async (ms) => {
      active++;
      peak = Math.max(peak, active);
      await new Promise((r) => setTimeout(r, ms));
      active--;
      return ms * 2;
    });
    expect(results).toEqual([60, 20, 40, 10, 30]);
    expect(peak).toBe(2);
  });
});
