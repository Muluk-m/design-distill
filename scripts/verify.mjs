#!/usr/bin/env node
// visual-verification (one round of the loop).
// Usage:
//   node scripts/verify.mjs <reference-tokens.json> <output url|path> [--out EVIDENCE_DIR] [--threshold N]
//
// Renders the generated output, extracts its tokens, compares against the saved
// design system, writes side-by-side evidence, and prints a report + concrete
// fix instructions. Exit 0 if the fidelity score meets the threshold, else 1 so
// the design-apply skill can iterate. Falls back to a token-only check (no
// screenshots) when no browser is available.

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolveTarget } from "./lib/target.mjs";
import { extractTokens, mapNativeComputed } from "./lib/extract-core.mjs";
import { runDembrandtCli } from "./lib/dembrandt.mjs";
import { compareTokenSets } from "./lib/compare-core.mjs";
import { deltasToInstructions, DEFAULT_LOOP } from "./lib/verify-core.mjs";
import { flagValue, positionals } from "./lib/args.mjs";

async function main() {
  const args = process.argv.slice(2);
  const [referencePath, output] = positionals(args, ["--out", "--threshold"]);
  if (!referencePath || !output) {
    process.stderr.write("usage: verify.mjs <reference-tokens.json> <output url|path> [--out DIR] [--threshold N]\n");
    process.exit(2);
  }
  const threshold = Number(flagValue(args, "--threshold")) || DEFAULT_LOOP.threshold;
  const outDir = flagValue(args, "--out");
  const reference = JSON.parse(readFileSync(referencePath, "utf-8"));

  // Framework project? Start its dev server and verify the served URL; otherwise
  // treat the output as a static artifact / URL.
  const { isProjectDir, startDevServer } = await import("./lib/devserver.mjs");
  let url;
  let stopServer = null;
  if (isProjectDir(output)) {
    const server = await startDevServer(output);
    url = server.url;
    stopServer = server.stop;
    process.stderr.write(`dev server ready at ${url}\n`);
  } else {
    url = resolveTarget(output).url;
  }

  // Probe for a browser; degrade to token-only (still attempts native/dembrandt
  // extraction, which needs a browser — so token-only here means "no evidence").
  const { browserAvailable } = await import("./lib/browser.mjs");
  const hasBrowser = await browserAvailable();

  const runners = {
    mcp: null,
    cli: (u) => runDembrandtCli(u),
    native: hasBrowser
      ? async (u) => {
          const { nativeExtract } = await import("./lib/browser.mjs");
          return mapNativeComputed(await nativeExtract(u), { target: u });
        }
      : null,
  };
  const outputTokens = await extractTokens(url, { runners });
  const report = compareTokenSets(reference, outputTokens, { thresholds: { passScore: threshold } });
  const instructions = deltasToInstructions(report);

  let evidence = null;
  if (hasBrowser && outDir) {
    mkdirSync(outDir, { recursive: true });
    const { capture } = await import("./lib/browser.mjs");
    const shot = await capture(url, { outDir, viewports: [{ name: "output", width: 1280, height: 800 }], schemes: ["light"] }).catch(() => null);
    writeFileSync(`${outDir}/report.json`, JSON.stringify(report, null, 2) + "\n");
    evidence = { reportPath: `${outDir}/report.json`, images: shot ? shot.images : [] };
  }

  const result = {
    score: report.score,
    pass: report.score >= threshold,
    threshold,
    visualVerification: hasBrowser,
    totalDeltas: report.totalDeltas,
    instructions,
    evidence,
  };
  if (!hasBrowser) {
    process.stderr.write("⚠ No browser available — token-only check; visual verification was skipped.\n");
  }
  if (stopServer) stopServer();
  process.stdout.write(JSON.stringify(result, null, 2) + "\n");
  process.exit(result.pass ? 0 : 1);
}

main().catch((err) => {
  process.stderr.write(`verify failed: ${err?.message || err}\n`);
  process.exit(1);
});
