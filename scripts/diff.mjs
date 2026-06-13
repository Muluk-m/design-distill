#!/usr/bin/env node
// diff (bundled): compare a saved design system against a fresh extraction of
// its source — drift detection. Replaces the legacy `design-distill diff`
// command; reuses the extract + compare primitives, no global CLI.
//
// Usage: node scripts/diff.mjs <name|tokens.json> [--threshold N]

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { libraryHome } from "./lib/config.mjs";
import { resolveTarget } from "./lib/target.mjs";
import { extractTokens, mapNativeComputed } from "./lib/extract-core.mjs";
import { runDembrandtCli } from "./lib/dembrandt.mjs";
import { compareTokenSets } from "./lib/compare-core.mjs";
import { flagValue, positional } from "./lib/args.mjs";

function loadSaved(nameOrPath) {
  if (nameOrPath.endsWith(".json") && existsSync(nameOrPath)) {
    return JSON.parse(readFileSync(nameOrPath, "utf-8"));
  }
  const p = join(libraryHome(), nameOrPath, "tokens.json");
  if (!existsSync(p)) {
    throw new Error(`no tokens.json for '${nameOrPath}' (looked at ${p}). Re-distill it to enable diff.`);
  }
  return JSON.parse(readFileSync(p, "utf-8"));
}

async function main() {
  const args = process.argv.slice(2);
  const nameOrPath = positional(args, ["--threshold"]);
  if (!nameOrPath) {
    process.stderr.write("usage: diff.mjs <name|tokens.json> [--threshold N]\n");
    process.exit(2);
  }
  const saved = loadSaved(nameOrPath);
  const sourceUrl = saved.source?.target || saved.meta?.source_url;
  if (!sourceUrl || !/^https?:\/\//.test(sourceUrl)) {
    process.stderr.write("saved design system has no remote source_url; diff requires a live source.\n");
    process.exit(2);
  }

  const { url } = resolveTarget(sourceUrl);
  const live = await extractTokens(url, {
    runners: {
      mcp: null,
      cli: (u) => runDembrandtCli(u),
      native: async (u) => mapNativeComputed(await (await import("./lib/browser.mjs")).nativeExtract(u), { target: u }),
    },
  });

  const threshold = Number(flagValue(args, "--threshold")) || 85;
  const report = compareTokenSets(saved, live, { thresholds: { passScore: threshold } });
  process.stdout.write(JSON.stringify({ source: sourceUrl, score: report.score, drifted: !report.match, ...report }, null, 2) + "\n");
  process.exit(report.match ? 0 : 1);
}

main().catch((err) => {
  process.stderr.write(`diff failed: ${err?.message || err}\n`);
  process.exit(1);
});
