import { describe, it, expect } from "vitest";
// @ts-expect-error - plain .mjs module without types
import { detectDevCommand, extractServerUrl, startDevServer } from "../../scripts/lib/devserver.mjs";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { EventEmitter } from "node:events";

describe("detectDevCommand", () => {
  it("prefers dev, then start, then serve", () => {
    expect(detectDevCommand({ scripts: { dev: "vite", start: "x" } }).script).toBe("dev");
    expect(detectDevCommand({ scripts: { start: "x", serve: "y" } }).script).toBe("start");
    expect(detectDevCommand({ scripts: { build: "x" } })).toBeNull();
  });
  it("returns an npm run command", () => {
    expect(detectDevCommand({ scripts: { dev: "vite" } })).toEqual({ script: "dev", command: "npm", args: ["run", "dev"] });
  });
});

describe("extractServerUrl", () => {
  it("pulls a localhost URL from dev-server output", () => {
    expect(extractServerUrl("  ➜  Local:   http://localhost:5173/")).toBe("http://localhost:5173/");
    expect(extractServerUrl("ready - started server on http://127.0.0.1:3000")).toBe("http://127.0.0.1:3000");
  });
  it("returns null when no URL is present", () => {
    expect(extractServerUrl("compiling...")).toBeNull();
  });
});

describe("startDevServer", () => {
  function fakeProc() {
    const p = new EventEmitter() as any;
    p.stdout = new EventEmitter();
    p.stderr = new EventEmitter();
    p.kill = () => { p.killed = true; };
    return p;
  }

  it("resolves with the served URL once the server prints it, and can stop", async () => {
    const dir = mkdtempSync(join(tmpdir(), "dd-proj-"));
    writeFileSync(join(dir, "package.json"), JSON.stringify({ scripts: { dev: "vite" } }));
    const proc = fakeProc();
    const promise = startDevServer(dir, { spawn: () => proc, timeoutMs: 2000 });
    setTimeout(() => proc.stdout.emit("data", Buffer.from("Local: http://localhost:4321/")), 5);
    const server = await promise;
    expect(server.url).toBe("http://localhost:4321/");
    server.stop();
    expect(proc.killed).toBe(true);
    rmSync(dir, { recursive: true, force: true });
  });

  it("rejects when no dev script exists", async () => {
    const dir = mkdtempSync(join(tmpdir(), "dd-proj-"));
    writeFileSync(join(dir, "package.json"), JSON.stringify({ scripts: { build: "x" } }));
    await expect(startDevServer(dir, { spawn: () => fakeProc() })).rejects.toThrow(/no dev/);
    rmSync(dir, { recursive: true, force: true });
  });
});
