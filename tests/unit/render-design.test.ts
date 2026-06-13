import { describe, it, expect } from "vitest";
// @ts-expect-error - plain .mjs module without types
import { normalizeSemantics } from "../../scripts/lib/semantic.mjs";
// @ts-expect-error - plain .mjs module without types
import { deriveEssence } from "../../scripts/lib/essence.mjs";
// @ts-expect-error - plain .mjs module without types
import { renderDesignMd } from "../../scripts/lib/render-design.mjs";

const raw = {
  colors: {
    bg: { value: "#08090a", confidence: "high" },
    panel: { value: "#1c1c1f", confidence: "medium" },
    border: { value: "#23252a", confidence: "low" },
    text: { value: "#f7f8f8", confidence: "high" },
    brand: { value: "#5e6ad2", confidence: "high" },
    danger: { value: "#eb5757", confidence: "medium" },
  },
  typography: { fontFamilies: ["Inter"], scale: { body: { size: "13px" } } },
  spacing: { base: "8px", values: ["8px"] },
  radius: { values: ["6px"] },
  shadows: [],
  components: { button: { background: "#5e6ad2", padding: "0 12px" } },
};

describe("deriveEssence", () => {
  const n = normalizeSemantics(raw);
  n.essence = deriveEssence(n);
  it("captures at most 5 defining traits", () => {
    expect(n.essence.length).toBeGreaterThan(0);
    expect(n.essence.length).toBeLessThanOrEqual(5);
  });
  it("identifies dark tone and the flat (no-shadow) depth language", () => {
    expect(n.essence.some((t: string) => /dark surface/.test(t))).toBe(true);
    expect(n.essence.some((t: string) => /flat/.test(t))).toBe(true);
  });
});

describe("renderDesignMd", () => {
  const n = normalizeSemantics(raw);
  n.essence = deriveEssence(n);
  const md = renderDesignMd(n, { name: "Test DS", source_url: "https://x.app", distilled: "2026-06-13" });

  it("renders header, essence, semantic roles, and anti-patterns", () => {
    expect(md).toContain("# Test DS");
    expect(md).toContain("source_url: https://x.app");
    expect(md).toContain("## Essence");
    expect(md).toContain("## Semantic Colors");
    expect(md).toContain("`color-primary`");
    expect(md).toContain("#5e6ad2");
    expect(md).toContain("## Anti-patterns");
  });

  it("records normalization decisions (provenance) in the view", () => {
    expect(md).toContain("## Normalization decisions");
    expect(md).toMatch(/floored to 16px/);
  });

  it("reflects flat depth language in elevation + anti-patterns", () => {
    expect(md).toMatch(/surface tiers \/ borders instead of shadows/);
  });
});
