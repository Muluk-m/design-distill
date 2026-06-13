#!/usr/bin/env node
// Bootstrap CLI wrapper (environment-bootstrap).
// Usage: node scripts/setup.mjs [--no-install] [--probe]
// Ensures Chromium + seeds bundled styles. With --probe, only reports the
// detected capability tier.

import { bootstrap } from "./lib/bootstrap.mjs";
import { probe } from "./lib/probe.mjs";

async function main() {
  const args = process.argv.slice(2);

  if (args.includes("--probe")) {
    const p = await probe();
    process.stdout.write(JSON.stringify(p, null, 2) + "\n");
    return;
  }

  const result = await bootstrap({ install: !args.includes("--no-install") });
  process.stdout.write(JSON.stringify(result, null, 2) + "\n");

  if (!result.browser.ok) {
    process.stderr.write(
      `\nBrowser not ready. Run:\n  ${result.browser.remediation}\n` +
        "(Visual capture will be unavailable until then; token-only extraction still works.)\n"
    );
    process.exit(1);
  }
  process.stderr.write(
    `\nReady. Seeded styles: ${result.styles.seeded.join(", ") || "(none new)"}\n`
  );
}

main().catch((err) => {
  process.stderr.write(`setup failed: ${err?.message || err}\n`);
  process.exit(1);
});
