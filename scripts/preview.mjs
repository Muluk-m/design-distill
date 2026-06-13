#!/usr/bin/env node
// preview (bundled): render a saved design system to an HTML page and open it.
// Reads the structured tokens.json (canonical); replaces the legacy
// `design-distill preview` command. No global CLI.
//
// Usage: node scripts/preview.mjs <name|tokens.json> [--no-open]

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir, platform } from "node:os";
import { execSync } from "node:child_process";
import { libraryHome } from "./lib/config.mjs";
import { isDark } from "./lib/color.mjs";
import { positional } from "./lib/args.mjs";

function load(nameOrPath) {
  if (nameOrPath.endsWith(".json") && existsSync(nameOrPath)) return JSON.parse(readFileSync(nameOrPath, "utf-8"));
  const p = join(libraryHome(), nameOrPath, "tokens.json");
  if (!existsSync(p)) throw new Error(`no tokens.json for '${nameOrPath}' (looked at ${p}).`);
  return JSON.parse(readFileSync(p, "utf-8"));
}

function esc(s) {
  return String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
}

export function generateHtml(tokens, name = "Design System") {
  const roles = tokens.semantic?.roles || {};
  const surface = roles["color-surface"] || "#ffffff";
  const text = roles["color-text"] || (isDark(surface) ? "#f7f8f8" : "#111111");
  const primary = roles["color-primary"] || "#2563eb";
  const font = (tokens.typography?.fontFamilies || [])[0] || "system-ui";
  const radius = tokens.semantic?.radius?.["radius-button"] || "6px";

  const swatch = (label, val) =>
    `<div class="sw"><span class="chip" style="background:${esc(val)}"></span><code>${esc(label)}</code><code class="v">${esc(val)}</code></div>`;

  const roleSwatches = Object.entries(roles).map(([k, v]) => swatch(k, v)).join("");
  const rawSwatches = Object.entries(tokens.colors || {}).map(([k, v]) => swatch(k, v.value)).join("");
  const typeRows = Object.entries(tokens.semantic?.typeScale || {})
    .map(([k, sz]) => `<div class="type" style="font-size:${esc(sz)}">${esc(k)} — ${esc(sz)} — The quick brown fox</div>`)
    .join("");
  const essence = (tokens.essence || []).map((t) => `<li>${esc(t)}</li>`).join("");

  return `<!doctype html><html><head><meta charset="utf-8"><title>${esc(name)}</title>
<style>
  body{margin:0;font-family:${esc(font)},system-ui,sans-serif;background:${esc(surface)};color:${esc(text)};padding:48px;max-width:1100px;margin:0 auto}
  h1{font-weight:600} h2{margin-top:48px;opacity:.7;font-size:14px;text-transform:uppercase;letter-spacing:.05em}
  .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px}
  .sw{display:flex;align-items:center;gap:10px;padding:8px;border:1px solid ${esc(roles["color-border"] || "rgba(128,128,128,.3)")};border-radius:${esc(radius)}}
  .chip{width:28px;height:28px;border-radius:6px;flex:0 0 auto;box-shadow:inset 0 0 0 1px rgba(128,128,128,.3)}
  code{font-family:ui-monospace,monospace;font-size:12px} .v{opacity:.6;margin-left:auto}
  .type{margin:8px 0;line-height:1.3}
  .btn{background:${esc(primary)};color:#fff;border:none;border-radius:${esc(radius)};padding:10px 18px;font:inherit;cursor:pointer}
  ul{line-height:1.7}
</style></head><body>
<h1>${esc(name)}</h1>
${essence ? `<h2>Essence</h2><ul>${essence}</ul>` : ""}
<h2>Semantic roles</h2><div class="grid">${roleSwatches}</div>
<h2>Palette (raw)</h2><div class="grid">${rawSwatches}</div>
<h2>Typography (${esc(font)})</h2>${typeRows}
<h2>Components</h2><button class="btn">Primary button</button>
</body></html>`;
}

function openInBrowser(file) {
  const os = platform();
  if (os === "darwin") execSync(`open "${file}"`);
  else if (os === "win32") execSync(`start "" "${file}"`);
  else execSync(`xdg-open "${file}"`);
}

function main() {
  const args = process.argv.slice(2);
  const nameOrPath = positional(args);
  if (!nameOrPath) {
    process.stderr.write("usage: preview.mjs <name|tokens.json> [--no-open]\n");
    process.exit(2);
  }
  const tokens = load(nameOrPath);
  const html = generateHtml(tokens, tokens.source?.name || nameOrPath);
  const file = join(tmpdir(), `design-distill-preview-${process.pid}.html`);
  writeFileSync(file, html, "utf-8");
  process.stdout.write(file + "\n");
  if (!args.includes("--no-open")) {
    try {
      openInBrowser(file);
    } catch {
      process.stderr.write(`Open it manually: ${file}\n`);
    }
  }
}

// Only run as CLI (allow importing generateHtml in tests).
if (import.meta.url === `file://${process.argv[1]}`) main();
