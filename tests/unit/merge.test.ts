import { describe, it, expect } from "vitest";
// @ts-expect-error - plain .mjs module without types
import { mergeTokenSets } from "../../scripts/lib/merge.mjs";

describe("mergeTokenSets", () => {
  const page1 = {
    colors: { brand: { value: "#5e6ad2", confidence: "medium" } },
    typography: { fontFamilies: ["Inter"], scale: { body: { size: "16px" } } },
    spacing: { base: "8px", values: ["8px"] },
    radius: { values: ["6px"] },
    shadows: [],
    components: {},
    meta: { framework: "Tailwind" },
  };
  const page2 = {
    colors: { brand: { value: "#5e6ad2", confidence: "high" }, accent: { value: "#7170ff" } },
    typography: { fontFamilies: ["Inter", "Berkeley Mono"], scale: { h1: { size: "48px" } } },
    spacing: { values: ["8px", "16px"] },
    radius: { values: ["6px", "12px"] },
    shadows: ["0 1px 2px rgba(0,0,0,.1)"],
    components: {},
  };

  it("merges colors keeping the higher-confidence value on conflict", () => {
    const m = mergeTokenSets([page1, page2]);
    expect(m.colors.brand.confidence).toBe("high");
    expect(m.colors.accent.value).toBe("#7170ff");
  });

  it("unions fonts, spacing, radius, shadows and merges scale + meta", () => {
    const m = mergeTokenSets([page1, page2]);
    expect(m.typography.fontFamilies.sort()).toEqual(["Berkeley Mono", "Inter"]);
    expect(m.spacing.values.sort()).toEqual(["16px", "8px"]);
    expect(m.radius.values.sort()).toEqual(["12px", "6px"]);
    expect(m.shadows).toHaveLength(1);
    expect(m.typography.scale.body.size).toBe("16px");
    expect(m.typography.scale.h1.size).toBe("48px");
    expect(m.meta.framework).toBe("Tailwind");
    expect(m.source.pages).toBe(2);
  });

  it("keeps a dark scheme as a distinct variant (not flattened)", () => {
    const dark = { colors: { surface: { value: "#08090a" } } };
    const m = mergeTokenSets([page1], { schemes: { dark } });
    expect(m.variants.dark.colors.surface.value).toBe("#08090a");
  });
});
