// Bulletproof setup (environment-bootstrap).
//
// Ensures the browser dependency and seeds bundled styles. When Chromium is
// missing it installs it; when it cannot, it returns a single actionable
// remediation command instead of a raw stack trace.

import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, copyFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { libraryHome } from "./config.mjs";

const REMEDIATION =
  "npx playwright install chromium   # or reuse an existing browser: install Google Chrome/Edge, or set DESIGN_DISTILL_CDP=<ws-endpoint>";

export async function ensureBrowser({ install = true, runner, available, source } = {}) {
  const browser = await import("./browser.mjs");
  const checkAvailable = available || browser.browserAvailable;
  const getSource = source || browser.browserSource;
  // Reuse first: if any browser is already usable (bundled, system Chrome/Edge,
  // or a CDP endpoint), do NOT download our own.
  if (await checkAvailable()) {
    return { ok: true, installed: false, source: await getSource() };
  }

  if (!install) {
    return { ok: false, installed: false, remediation: REMEDIATION };
  }

  const run = runner || (() => spawnSync("npx", ["playwright", "install", "chromium"], { stdio: "inherit" }));
  let result;
  try {
    result = run();
  } catch {
    return { ok: false, installed: false, remediation: REMEDIATION };
  }
  if (result && result.status === 0 && (await checkAvailable())) {
    return { ok: true, installed: true };
  }
  return { ok: false, installed: false, remediation: REMEDIATION };
}

function bundledDir() {
  const here = dirname(fileURLToPath(import.meta.url));
  return join(here, "..", "..", "bundled");
}

// Seed the bundled styles into the library (without overwriting existing ones).
export function seedBundledStyles({ force = false } = {}) {
  const src = bundledDir();
  const home = libraryHome();
  const seeded = [];
  const skipped = [];
  if (!existsSync(src)) return { seeded, skipped };
  mkdirSync(home, { recursive: true });
  for (const entry of readdirSync(src, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const from = join(src, entry.name, "DESIGN.md");
    if (!existsSync(from)) continue;
    const destDir = join(home, entry.name);
    const to = join(destDir, "DESIGN.md");
    if (existsSync(to) && !force) {
      skipped.push(entry.name);
      continue;
    }
    mkdirSync(destDir, { recursive: true });
    copyFileSync(from, to);
    seeded.push(entry.name);
  }
  return { seeded, skipped };
}

export async function bootstrap(opts = {}) {
  const browser = await ensureBrowser(opts);
  const styles = seedBundledStyles(opts);
  return { browser, styles };
}
