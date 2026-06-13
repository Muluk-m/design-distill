#!/usr/bin/env node
// compare primitive CLI wrapper.
// Usage: node scripts/compare.mjs <reference.json> <candidate.json> [--threshold N]
// Reference = saved design system; candidate = live re-extraction or generated
// output. Emits the structured delta report + fidelity score on stdout.

import { readFileSync } from "node:fs";
import { compareTokenSets } from "./lib/compare-core.mjs";
import { flagValue } from "./lib/args.mjs";

function main() {
  const args = process.argv.slice(2);
  const files = args.filter((a) => !a.startsWith("--"));
  if (files.length < 2) {
    process.stderr.write("usage: compare.mjs <reference.json> <candidate.json> [--threshold N]\n");
    process.exit(2);
  }
  const [refPath, candPath] = files;
  const reference = JSON.parse(readFileSync(refPath, "utf-8"));
  const candidate = JSON.parse(readFileSync(candPath, "utf-8"));
  const thresholdOverride = flagValue(args, "--threshold");
  const thresholds = thresholdOverride ? { passScore: Number(thresholdOverride) } : {};

  const report = compareTokenSets(reference, candidate, { thresholds });
  process.stdout.write(JSON.stringify(report, null, 2) + "\n");
  // Exit non-zero when below threshold so callers can gate in shell.
  process.exit(report.pass ? 0 : 1);
}

main();
