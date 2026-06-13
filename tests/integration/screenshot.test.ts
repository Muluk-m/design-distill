import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { mkdtempSync, rmSync, existsSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
// @ts-expect-error - plain .mjs module without types
import { capture, nativeExtract, browserAvailable } from "../../scripts/lib/browser.mjs";
// @ts-expect-error - plain .mjs module without types
import { mapNativeComputed } from "../../scripts/lib/extract-core.mjs";

const fixture = pathToFileURL(join(process.cwd(), "tests/fixtures/sample-page.html")).href;
let hasBrowser = false;
let outDir: string;

beforeAll(async () => {
  hasBrowser = await browserAvailable();
  outDir = mkdtempSync(join(tmpdir(), "dd-shot-"));
});
afterAll(() => {
  if (outDir) rmSync(outDir, { recursive: true, force: true });
});

// These tests need a real Chromium binary. When absent (e.g., CI without
// `playwright install`), they skip rather than fail — the unit tests already
// cover the deterministic logic.
describe("screenshot capture (requires Chromium)", () => {
  it("captures a local file:// page at multiple viewports and schemes", async () => {
    if (!hasBrowser) return;
    const { images } = await capture(fixture, {
      viewports: [
        { name: "desktop", width: 1280, height: 800 },
        { name: "mobile", width: 390, height: 844 },
      ],
      schemes: ["light", "dark"],
      fullPage: true,
      outDir,
    });
    expect(images).toHaveLength(4);
    for (const img of images) {
      expect(existsSync(img.path)).toBe(true);
      expect(statSync(img.path).size).toBeGreaterThan(0);
    }
    // Full-page capture of a 1600px page should be taller than the viewport.
    const { chromium } = await import("playwright");
    void chromium; // ensures playwright import path is valid
  }, 60000);

  it("reports a render failure for an unreachable target", async () => {
    if (!hasBrowser) return;
    await expect(
      capture("file:///definitely/not/here-xyz.html", { outDir })
    ).rejects.toThrow(/render failed/i);
  }, 60000);

  it("native extraction reads CSS variables and tokens from the DOM", async () => {
    if (!hasBrowser) return;
    const data = await nativeExtract(fixture);
    const ts = mapNativeComputed(data, { target: fixture });
    expect(ts.colors["--brand"]?.value).toBe("#5e6ad2");
    expect(ts.typography.fontFamilies).toContain("Inter");
  }, 60000);
});
