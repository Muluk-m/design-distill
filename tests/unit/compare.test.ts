import { describe, it, expect } from "vitest";
// @ts-expect-error - plain .mjs module without types
import { compareTokenSets, DEFAULT_THRESHOLDS } from "../../scripts/lib/compare-core.mjs";

const ref = {
  colors: {
    primary: { value: "#5e6ad2", confidence: "high" },
    surface: { value: "#08090a" },
  },
  typography: { fontFamilies: ["Inter"], scale: { body: { size: "16px" } } },
  spacing: { values: ["8px", "16px", "24px"] },
  radius: { values: ["4px", "6px"] },
  shadows: ["0 1px 2px rgba(0,0,0,0.1)"],
  components: { button: { background: "#5e6ad2", padding: "0 12px" } },
};

describe("compareTokenSets", () => {
  it("reports a perfect match for identical sets", () => {
    const r = compareTokenSets(ref, ref);
    expect(r.match).toBe(true);
    expect(r.totalDeltas).toBe(0);
    expect(r.score).toBe(100);
    expect(r.pass).toBe(true);
  });

  it("ignores sub-threshold color differences", () => {
    const cand = JSON.parse(JSON.stringify(ref));
    cand.colors.primary.value = "#5e6ad3"; // deltaE ~1, below default 10
    const r = compareTokenSets(ref, cand);
    expect(r.categories.colors.deltas).toHaveLength(0);
  });

  it("flags over-threshold color differences", () => {
    const cand = JSON.parse(JSON.stringify(ref));
    cand.colors.primary.value = "#ff0000";
    const r = compareTokenSets(ref, cand);
    const d = r.categories.colors.deltas.find((x: any) => x.token === "primary");
    expect(d).toBeTruthy();
    expect(d.reference).toBe("#5e6ad2");
    expect(d.candidate).toBe("#ff0000");
    expect(r.score).toBeLessThan(100);
    expect(r.pass).toBe(false);
  });

  it("detects font family and spacing differences across categories", () => {
    const cand = JSON.parse(JSON.stringify(ref));
    cand.typography.fontFamilies = ["Helvetica"];
    cand.spacing.values = ["10px"]; // none within 1px of 8/16/24
    const r = compareTokenSets(ref, cand);
    expect(r.categories.typography.deltas.length).toBeGreaterThan(0);
    expect(r.categories.spacing.deltas.length).toBeGreaterThan(0);
  });

  it("flags a spacing base-unit (grid) shift", () => {
    const withBase = { ...ref, spacing: { base: "8px", values: ["8px", "16px"] } };
    const shifted = { ...ref, spacing: { base: "4px", values: ["8px", "16px"] } };
    const r = compareTokenSets(withBase, shifted);
    const baseDelta = r.categories.spacing.deltas.find((x: any) => x.token === "base");
    expect(baseDelta).toBeTruthy();
    expect(baseDelta.reference).toBe("8px");
    expect(baseDelta.candidate).toBe("4px");
  });

  it("does not penalize candidate extras not in the reference", () => {
    const cand = JSON.parse(JSON.stringify(ref));
    cand.colors.extra = { value: "#123456" };
    const r = compareTokenSets(ref, cand);
    expect(r.match).toBe(true);
  });

  it("supports output-verification: low fidelity drives iterate", () => {
    const output = {
      colors: { primary: { value: "#00ff00" }, surface: { value: "#ffffff" } },
      typography: { fontFamilies: ["Comic Sans"], scale: { body: { size: "12px" } } },
      spacing: { values: ["3px"] },
      radius: { values: ["20px"] },
      shadows: [],
      components: {},
    };
    const r = compareTokenSets(ref, output);
    expect(r.pass).toBe(false);
    expect(r.score).toBeLessThan(DEFAULT_THRESHOLDS.passScore);
  });
});

describe("rgb() color support", () => {
  it("compares rgb() and hex equivalently and within threshold", () => {
    const a = { colors: { p: { value: "rgb(94, 106, 210)" } } };
    const b = { colors: { p: { value: "#5e6ad2" } } }; // == rgb(94,106,210)
    expect(compareTokenSets(a, b).categories.colors.deltas).toHaveLength(0);
  });
});
