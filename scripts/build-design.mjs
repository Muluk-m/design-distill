#!/usr/bin/env node
// build-design: raw token set (from extract.mjs) → normalized structured set
// (semantic roles + essence + decisions) and a rendered DESIGN.md.
//
// Usage:
//   node scripts/extract.mjs <url> | node scripts/build-design.mjs --name linear --source-url <url> --out <dir>
//   node scripts/build-design.mjs <raw-tokenset.json> [--name N] [--source-url U] [--out DIR]
//
// Writes <dir>/tokens.json (canonical) + <dir>/DESIGN.md (view) when --out is
// given; otherwise prints the structured JSON to stdout.

import { readFileSync, writeFileSync, mkdirSync, readFileSync as rf } from "node:fs";
import { join } from "node:path";
import { normalizeSemantics } from "./lib/semantic.mjs";
import { deriveEssence } from "./lib/essence.mjs";
import { renderDesignMd } from "./lib/render-design.mjs";
import { auditContrast } from "./lib/wcag.mjs";
import { flagValue, positional } from "./lib/args.mjs";

function readInput(path) {
  if (path && path !== "-") return readFileSync(path, "utf-8");
  return rf(0, "utf-8"); // stdin
}

function main() {
  const args = process.argv.slice(2);
  const inputPath = positional(args, ["--name", "--source-url", "--out", "--distilled"]);
  const raw = JSON.parse(readInput(inputPath));

  const normalized = normalizeSemantics(raw);
  normalized.essence = deriveEssence(normalized);
  // WCAG contrast audit over the semantic palette — records findings, never
  // mutates the source palette.
  normalized.accessibility = auditContrast(normalized.semantic.roles);

  const meta = {
    name: flagValue(args, "--name") || "Design System",
    source_url: flagValue(args, "--source-url") || raw.source?.target || undefined,
    distilled: flagValue(args, "--distilled") || undefined,
  };

  const outDir = flagValue(args, "--out");
  if (outDir) {
    mkdirSync(outDir, { recursive: true });
    writeFileSync(join(outDir, "tokens.json"), JSON.stringify(normalized, null, 2) + "\n");
    writeFileSync(join(outDir, "DESIGN.md"), renderDesignMd(normalized, meta));
    process.stderr.write(`wrote ${join(outDir, "tokens.json")} + DESIGN.md\n`);
  } else {
    process.stdout.write(JSON.stringify(normalized, null, 2) + "\n");
  }
}

main();
