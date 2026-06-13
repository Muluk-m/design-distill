// Pinned dembrandt CLI runner. Spawns `npx -y dembrandt@<pin> <url> --json-only`
// and maps the JSON into our token set. Returns null on any failure so extract
// falls through to the native path.

import { spawn } from "node:child_process";
import { dembrandtSpec } from "./config.mjs";
import { mapDembrandtJson } from "./extract-core.mjs";

export function runDembrandtCli(target, opts = {}) {
  const extraArgs = opts.args || [];
  const timeoutMs = opts.timeoutMs ?? 120000;
  return new Promise((resolve) => {
    const args = ["-y", dembrandtSpec(), target, "--json-only", ...extraArgs];
    let stdout = "";
    let stderr = "";
    let proc;
    try {
      proc = spawn("npx", args, { stdio: ["ignore", "pipe", "pipe"] });
    } catch {
      resolve(null);
      return;
    }
    const timer = setTimeout(() => {
      try {
        proc.kill("SIGKILL");
      } catch {
        /* ignore */
      }
      resolve(null);
    }, timeoutMs);

    proc.stdout.on("data", (d) => (stdout += d));
    proc.stderr.on("data", (d) => (stderr += d));
    proc.on("error", () => {
      clearTimeout(timer);
      resolve(null);
    });
    proc.on("close", (code) => {
      clearTimeout(timer);
      if (code !== 0 && !stdout.trim()) {
        resolve(null);
        return;
      }
      try {
        // Some versions print progress before JSON; grab the first {...} block.
        const start = stdout.indexOf("{");
        const json = JSON.parse(start >= 0 ? stdout.slice(start) : stdout);
        resolve(mapDembrandtJson(json, { target }));
      } catch {
        resolve(null);
      }
    });
  });
}
