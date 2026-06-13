import { describe, it, expect } from "vitest";
// @ts-expect-error - plain .mjs module without types
import { generateHtml } from "../../scripts/preview.mjs";

const tokens = {
  source: { name: "Sample" },
  colors: { brand: { value: "#5e6ad2" }, bg: { value: "#08090a" } },
  typography: { fontFamilies: ["Inter"] },
  semantic: {
    roles: { "color-primary": "#5e6ad2", "color-surface": "#08090a", "color-text": "#f7f8f8" },
    typeScale: { "text-base": "16px", h1: "48px" },
    radius: { "radius-button": "6px" },
  },
  essence: ["dark surface (#08090a)", "brand accent #5e6ad2"],
};

describe("preview generateHtml", () => {
  const html = generateHtml(tokens, "Sample");

  it("produces a full HTML document", () => {
    expect(html.startsWith("<!doctype html>")).toBe(true);
    expect(html).toContain("</html>");
  });

  it("applies the surface/primary/font from the design system", () => {
    expect(html).toContain("#08090a"); // surface
    expect(html).toContain("#5e6ad2"); // primary
    expect(html).toContain("Inter");
  });

  it("renders semantic roles, raw palette, essence, and type scale", () => {
    expect(html).toContain("color-primary");
    expect(html).toContain("brand");
    expect(html).toContain("dark surface");
    expect(html).toContain("text-base");
  });

  it("escapes interpolated values", () => {
    const evil = { ...tokens, colors: { x: { value: '"><script>alert(1)</script>' } } };
    const out = generateHtml(evil, "x");
    expect(out).not.toContain("<script>alert(1)</script>");
  });
});
