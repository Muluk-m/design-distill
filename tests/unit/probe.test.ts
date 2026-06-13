import { describe, it, expect } from "vitest";
// @ts-expect-error - plain .mjs module without types
import { probe, selectTier } from "../../scripts/lib/probe.mjs";

describe("selectTier", () => {
  it("full when a browser is present", () => {
    expect(selectTier({ browser: true, extractor: true })).toBe("full");
  });
  it("token-only when only an extractor is present", () => {
    expect(selectTier({ browser: false, extractor: true })).toBe("token-only");
  });
  it("token-only when nothing is present (never crashes)", () => {
    expect(selectTier({ browser: false, extractor: false })).toBe("token-only");
  });
});

describe("probe", () => {
  it("reports full when browser detector resolves true", async () => {
    const p = await probe({ hasBrowser: async () => true, hasExtractor: async () => true });
    expect(p).toMatchObject({ browser: true, extractor: true, tier: "full" });
  });

  it("reuses the browser result for the extractor (no second launch)", async () => {
    let browserChecks = 0;
    const p = await probe({
      hasBrowser: async () => {
        browserChecks += 1;
        return true;
      },
    });
    expect(browserChecks).toBe(1); // extractor derived from browser, not re-launched
    expect(p.extractor).toBe(true);
  });

  it("treats a throwing detector as absent rather than crashing", async () => {
    const p = await probe({
      hasBrowser: async () => {
        throw new Error("boom");
      },
      hasExtractor: async () => true,
    });
    expect(p.browser).toBe(false);
    expect(p.tier).toBe("token-only");
  });
});
