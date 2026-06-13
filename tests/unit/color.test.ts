import { describe, it, expect } from "vitest";
import {
  parseColor,
  alphaOf,
  isOpaque,
  isColor,
  isDark,
  deltaE,
  hueFamily,
  // @ts-expect-error - plain .mjs module without types
} from "../../scripts/lib/color.mjs";

describe("parseColor", () => {
  it("parses #rrggbb, #rgb, rgb(), rgba()", () => {
    expect(parseColor("#5e6ad2")).toEqual([94, 106, 210]);
    expect(parseColor("#fff")).toEqual([255, 255, 255]);
    expect(parseColor("rgb(94, 106, 210)")).toEqual([94, 106, 210]);
    expect(parseColor("rgba(0,0,0,0.5)")).toEqual([0, 0, 0]);
  });
  it("returns null for junk", () => {
    expect(parseColor("not-a-color")).toBeNull();
    expect(parseColor(123 as any)).toBeNull();
  });
});

describe("alphaOf / isOpaque", () => {
  it("reads the alpha channel", () => {
    expect(alphaOf("rgba(255,255,255,0)")).toBe(0);
    expect(alphaOf("rgba(0,0,0,0.4)")).toBe(0.4);
    expect(alphaOf("#000000")).toBe(1);
    expect(alphaOf("rgb(0,0,0)")).toBe(1);
  });
  it("treats near-transparent colors as non-opaque", () => {
    expect(isOpaque("rgba(255,255,255,0)")).toBe(false);
    expect(isOpaque("rgba(0,0,0,0.2)")).toBe(false);
    expect(isOpaque("#5e6ad2")).toBe(true);
  });
});

describe("hueFamily", () => {
  it("classifies status hues and neutrals", () => {
    expect(hueFamily("#eb5757")).toBe("red");
    expect(hueFamily("#fc7840")).toBe("orange");
    expect(hueFamily("#27a644")).toBe("green");
    expect(hueFamily("#08090a")).toBe("neutral");
    expect(hueFamily("#ffffff")).toBe("neutral");
  });
  it("works on rgb() input too", () => {
    expect(hueFamily("rgb(235,87,87)")).toBe("red");
  });
});

describe("isDark / deltaE / isColor", () => {
  it("isDark by luminance", () => {
    expect(isDark("#08090a")).toBe(true);
    expect(isDark("#ffffff")).toBe(false);
  });
  it("deltaE is ~0 for equal colors across formats", () => {
    expect(deltaE("#5e6ad2", "rgb(94,106,210)")).toBe(0);
  });
  it("isColor accepts hex + rgb, rejects junk", () => {
    expect(isColor("#fff")).toBe(true);
    expect(isColor("rgb(1,2,3)")).toBe(true);
    expect(isColor("banana")).toBe(false);
  });
});
