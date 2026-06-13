#!/usr/bin/env node
// screenshot primitive CLI wrapper.
// Usage:
//   node scripts/screenshot.mjs <url|path> [--out DIR] [--viewports desktop,mobile]
//        [--schemes light,dark] [--no-full-page]
// Emits JSON describing the captured images on stdout.

import { resolveTarget } from "./lib/target.mjs";
import { capture } from "./lib/browser.mjs";
import { VIEWPORTS } from "./lib/config.mjs";
import { flagValue, positional } from "./lib/args.mjs";

async function main() {
  const args = process.argv.slice(2);
  const target = positional(args, ["--out", "--viewports", "--schemes"]);
  if (!target) {
    process.stderr.write("usage: screenshot.mjs <url|path> [--out DIR] [--viewports ...] [--schemes ...]\n");
    process.exit(2);
  }
  const { url } = resolveTarget(target);
  const outDir = flagValue(args, "--out", ".");
  const vpNames = flagValue(args, "--viewports", "desktop").split(",").map((s) => s.trim());
  const schemes = flagValue(args, "--schemes", "light").split(",").map((s) => s.trim());
  const fullPage = !args.includes("--no-full-page");

  const viewports = vpNames.map((name) => {
    const v = VIEWPORTS[name] || VIEWPORTS.desktop;
    return { name, width: v.width, height: v.height };
  });

  const result = await capture(url, { viewports, schemes, fullPage, outDir });
  process.stdout.write(JSON.stringify(result, null, 2) + "\n");
}

main().catch((err) => {
  process.stderr.write(`screenshot failed: ${err?.message || err}\n`);
  process.exit(1);
});
