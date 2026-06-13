import { describe, it, expect } from "vitest";
// @ts-expect-error - plain .mjs module without types
import { normalizeSemantics, nearestModularStep } from "../../scripts/lib/semantic.mjs";

describe("nearestModularStep", () => {
  it("snaps to the base-16 / 1.25 scale", () => {
    expect(nearestModularStep(16)).toBe(16);
    expect(nearestModularStep(15)).toBe(16);
    expect(nearestModularStep(31)).toBe(31); // 16*1.25^3 = 31.25
    expect(nearestModularStep(50)).toBe(49); // 16*1.25^5 ≈ 48.8
  });
});

describe("normalizeSemantics", () => {
  const ts = {
    colors: {
      bg: { value: "#08090a", confidence: "high" }, // near-black neutral
      panel: { value: "#1c1c1f", confidence: "medium" }, // dark neutral
      text: { value: "#f7f8f8", confidence: "high" }, // light neutral
      muted: { value: "#8a8f98", confidence: "low" }, // mid neutral
      brand: { value: "#5e6ad2", confidence: "high" }, // indigo
      danger: { value: "#eb5757", confidence: "medium" }, // red
      warn: { value: "#fc7840", confidence: "medium" }, // orange
      ok: { value: "#27a644", confidence: "medium" }, // green
    },
    typography: { fontFamilies: ["Inter"], scale: { body: { size: "13px" }, h1: { size: "47px" } } },
    spacing: { base: "8px", values: ["8px", "16px"] },
    radius: { values: ["4px", "8px"] },
    components: { button: { background: "#5e6ad2" } },
  };

  const out = normalizeSemantics(ts);
  const roles = out.semantic.roles;

  it("assigns a dark-theme surface and opposite-extreme text", () => {
    expect(roles["color-surface"]).toBe("#08090a");
    expect(roles["color-text"]).toBe("#f7f8f8");
  });

  it("picks the high-confidence brand as primary (matches button bg)", () => {
    expect(roles["color-primary"]).toBe("#5e6ad2");
  });

  it("reserves status hues: error=red, warning=amber, success=green", () => {
    expect(roles["color-error"]).toBe("#eb5757");
    expect(roles["color-warning"]).toBe("#fc7840");
    expect(roles["color-success"]).toBe("#27a644");
  });

  it("floors body text to 16px and records the override", () => {
    expect(out.semantic.typeScale["text-base"]).toBe("16px");
    expect(out.decisions.some((d: string) => /floored to 16px/.test(d))).toBe(true);
  });

  it("derives spacing base and radius roles", () => {
    expect(out.semantic.spacing.base).toBe("8px");
    expect(out.semantic.radius["radius-button"]).toBe("4px");
    expect(out.semantic.radius["radius-card"]).toBe("8px");
  });

  it("retains the raw token set (semantic is additive)", () => {
    expect(out.colors.brand.value).toBe("#5e6ad2");
    expect(Array.isArray(out.decisions)).toBe(true);
  });

  it("will not let a brand-orange double as warning", () => {
    const orangeBrand = {
      colors: {
        bg: { value: "#ffffff", confidence: "high" },
        text: { value: "#111111", confidence: "high" },
        brand: { value: "#fc7840", confidence: "high" }, // orange brand, only orange
      },
      typography: { fontFamilies: [], scale: {} },
      spacing: { values: [] },
      radius: { values: [] },
      components: {},
    };
    const r = normalizeSemantics(orangeBrand);
    expect(r.semantic.roles["color-warning"]).toBeUndefined();
    expect(r.decisions.some((d: string) => /orange cannot double as warning/.test(d))).toBe(true);
  });
});
