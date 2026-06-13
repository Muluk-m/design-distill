// Render framework projects (React/Next/Vite/…) for the visual loop by starting
// their dev server, capturing the served URL, then tearing it down. The pure
// helpers (command detection + URL parsing) are testable; startDevServer wires
// them to a real child process.

import { spawn } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

// Choose a dev command from package.json scripts, preferring dev → start → serve.
export function detectDevCommand(pkgJson) {
  const scripts = (pkgJson && pkgJson.scripts) || {};
  for (const name of ["dev", "start", "serve", "preview"]) {
    if (scripts[name]) return { script: name, command: "npm", args: ["run", name] };
  }
  return null;
}

// Pull the first localhost/127.0.0.1 URL a dev server prints when ready.
export function extractServerUrl(text) {
  const m = String(text).match(/https?:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?(?:\/\S*)?/i);
  return m ? m[0].replace(/[).,]+$/, "") : null;
}

export function isProjectDir(path) {
  try {
    return existsSync(join(path, "package.json"));
  } catch {
    return false;
  }
}

/**
 * Start a project's dev server and resolve once it prints a localhost URL.
 * @returns {Promise<{ url: string, stop: () => void }>}
 */
export function startDevServer(projectDir, opts = {}) {
  const spawnFn = opts.spawn || spawn;
  const timeoutMs = opts.timeoutMs ?? 60000;
  const pkgPath = join(projectDir, "package.json");
  if (!existsSync(pkgPath)) return Promise.reject(new Error(`no package.json in ${projectDir}`));
  const cmd = detectDevCommand(JSON.parse(readFileSync(pkgPath, "utf-8")));
  if (!cmd) return Promise.reject(new Error("no dev/start/serve/preview script found"));

  return new Promise((resolve, reject) => {
    const proc = spawnFn(cmd.command, cmd.args, { cwd: projectDir, stdio: ["ignore", "pipe", "pipe"] });
    const stop = () => {
      try {
        proc.kill("SIGTERM");
      } catch {
        /* ignore */
      }
    };
    const timer = setTimeout(() => {
      stop();
      reject(new Error(`dev server did not become ready within ${timeoutMs}ms`));
    }, timeoutMs);

    const onData = (buf) => {
      const url = extractServerUrl(buf.toString());
      if (url) {
        clearTimeout(timer);
        resolve({ url, stop });
      }
    };
    proc.stdout?.on("data", onData);
    proc.stderr?.on("data", onData);
    proc.on("error", (err) => {
      clearTimeout(timer);
      reject(err);
    });
    proc.on("exit", (code) => {
      clearTimeout(timer);
      reject(new Error(`dev server exited early (code ${code})`));
    });
  });
}
