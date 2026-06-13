import { describe, it, expect } from "vitest";
// @ts-expect-error - plain .mjs module without types
import { contrastRatio, auditContrast, AA_NORMAL } from "../../scripts/lib/wcag.mjs";

describe("contrastRatio", () => {
  it("computes 21:1 for black on white", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBe(21);
  });
  it("is 1:1 for identical colors", () => {
    expect(contrastRatio("#5e6ad2", "#5e6ad2")).toBe(1);
  });
  it("is order-independent", () => {
    expect(contrastRatio("#08090a", "#f7f8f8")).toBe(contrastRatio("#f7f8f8", "#08090a"));
  });
  it("supports rgb() input as well as hex", () => {
    expect(contrastRatio("rgb(0,0,0)", "#fff")).toBe(21);
  });

  it("returns null for unparseable input", () => {
    expect(contrastRatio("not-a-color", "#fff")).toBeNull();
  });
});

describe("auditContrast", () => {
  it("passes high-contrast text on surface", () => {
    const a = auditContrast({ "color-surface": "#08090a", "color-text": "#f7f8f8" });
    const pair = a.pairs.find((p: any) => p.name === "text-on-surface");
    expect(pair.pass).toBe(true);
    expect(pair.ratio).toBeGreaterThan(AA_NORMAL);
    expect(a.failures).toBe(0);
  });

  it("flags low-contrast secondary text as a failure without changing values", () => {
    const roles = { "color-surface": "#ffffff", "color-text-secondary": "#cccccc" };
    const a = auditContrast(roles);
    const pair = a.pairs.find((p: any) => p.name === "text-secondary-on-surface");
    expect(pair.pass).toBe(false);
    expect(a.failures).toBe(1);
    // Source palette untouched.
    expect(roles["color-text-secondary"]).toBe("#cccccc");
  });

  it("skips pairs with no surface", () => {
    expect(auditContrast({ "color-text": "#000" }).pairs).toHaveLength(0);
  });
});
