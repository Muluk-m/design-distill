#!/usr/bin/env node
// extract primitive CLI wrapper.
// Usage: node scripts/extract.mjs <url|path> [--no-dembrandt]
// Emits the stable token-set JSON on stdout.

import { resolveTarget } from "./lib/target.mjs";
import { extractTokens, mapNativeComputed } from "./lib/extract-core.mjs";
import { runDembrandtCli } from "./lib/dembrandt.mjs";
import { mergeTokenSets } from "./lib/merge.mjs";
import { flagValue, positional } from "./lib/args.mjs";

// Map comprehensive-extraction flags to dembrandt CLI args.
function dembrandtArgs(args) {
  const out = [];
  const crawl = flagValue(args, "--crawl");
  if (crawl) out.push("--crawl", crawl);
  if (args.includes("--sitemap")) out.push("--sitemap");
  if (args.includes("--mobile")) out.push("--mobile");
  if (args.includes("--slow")) out.push("--slow");
  const cookie = flagValue(args, "--cookie");
  if (cookie) out.push("--cookie", cookie);
  const header = flagValue(args, "--header");
  if (header) out.push("--header", header);
  return out;
}

async function main() {
  const args = process.argv.slice(2);
  const rawTarget = positional(args, ["--crawl", "--cookie", "--header"]);
  if (!rawTarget) {
    process.stderr.write(
      "usage: extract.mjs <url|path> [--no-dembrandt] [--crawl N] [--sitemap] [--mobile] [--slow]\n" +
        "                   [--dark-mode] [--cookie S] [--header S]\n"
    );
    process.exit(2);
  }
  const useDembrandt = !args.includes("--no-dembrandt");
  const { url } = resolveTarget(rawTarget);
  const baseArgs = dembrandtArgs(args);
  const log = (m) => process.stderr.write(m + "\n");

  const makeRunners = (extra) => ({
    mcp: null, // MCP tools are agent-level; not wired into the bundled script
    cli: useDembrandt ? (u) => runDembrandtCli(u, { args: [...baseArgs, ...extra] }) : null,
    native: async (u) => mapNativeComputed(await (await import("./lib/browser.mjs")).nativeExtract(u), { target: u }),
  });

  const tokens = await extractTokens(url, { runners: makeRunners([]), log });

  // Dual-scheme: capture the dark palette too and keep it as a variant.
  let result = tokens;
  if (args.includes("--dark-mode") && useDembrandt) {
    const dark = await extractTokens(url, { runners: makeRunners(["--dark-mode"]), log });
    result = mergeTokenSets([tokens], { schemes: { dark } });
    result.source = tokens.source;
  }

  process.stdout.write(JSON.stringify(result, null, 2) + "\n");
}

main().catch((err) => {
  process.stderr.write(`extract failed: ${err?.message || err}\n`);
  process.exit(1);
});
