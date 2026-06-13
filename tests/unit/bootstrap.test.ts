import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, existsSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
// @ts-expect-error - plain .mjs module without types
import { seedBundledStyles, ensureBrowser } from "../../scripts/lib/bootstrap.mjs";

let home: string;
const prev = process.env.DESIGN_DISTILL_HOME;

beforeEach(() => {
  home = mkdtempSync(join(tmpdir(), "dd-home-"));
  process.env.DESIGN_DISTILL_HOME = home;
});
afterEach(() => {
  rmSync(home, { recursive: true, force: true });
  if (prev === undefined) delete process.env.DESIGN_DISTILL_HOME;
  else process.env.DESIGN_DISTILL_HOME = prev;
});

describe("seedBundledStyles", () => {
  it("seeds bundled styles into DESIGN_DISTILL_HOME", () => {
    const { seeded } = seedBundledStyles();
    expect(seeded).toContain("linear");
    expect(existsSync(join(home, "linear", "DESIGN.md"))).toBe(true);
    // The 5 bundled styles ship in the repo.
    expect(readdirSync(home).length).toBeGreaterThanOrEqual(5);
  });

  it("does not overwrite existing styles unless forced", () => {
    seedBundledStyles();
    const second = seedBundledStyles();
    expect(second.seeded).toHaveLength(0);
    expect(second.skipped).toContain("linear");
    const forced = seedBundledStyles({ force: true });
    expect(forced.seeded).toContain("linear");
  });
});

describe("ensureBrowser", () => {
  it("reuses an existing browser without installing", async () => {
    const r = await ensureBrowser({
      available: async () => true,
      source: async () => "system-chrome",
    });
    expect(r).toEqual({ ok: true, installed: false, source: "system-chrome" });
  });

  it("returns a clean remediation command when install is disabled and no browser", async () => {
    const r = await ensureBrowser({ install: false, available: async () => false });
    expect(r.ok).toBe(false);
    expect(r.remediation).toContain("npx playwright install chromium");
  });

  it("reports failure with remediation when the installer fails", async () => {
    const r = await ensureBrowser({
      install: true,
      available: async () => false,
      runner: () => ({ status: 1 }),
    });
    expect(r.ok).toBe(false);
    expect(r.remediation).toContain("npx playwright install chromium");
  });

  it("succeeds when install fixes a missing browser", async () => {
    let installed = false;
    const r = await ensureBrowser({
      install: true,
      available: async () => installed,
      runner: () => {
        installed = true;
        return { status: 0 };
      },
    });
    expect(r).toEqual({ ok: true, installed: true });
  });
});
