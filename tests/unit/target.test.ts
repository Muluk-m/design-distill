import { describe, it, expect } from "vitest";
// @ts-expect-error - plain .mjs module without types
import { resolveTarget, isUrl } from "../../scripts/lib/target.mjs";

describe("resolveTarget", () => {
  it("passes through http/https URLs", () => {
    expect(resolveTarget("https://linear.app")).toEqual({
      kind: "url",
      url: "https://linear.app",
      isLocal: false,
    });
    expect(resolveTarget("http://example.com").kind).toBe("url");
  });

  it("keeps file:// URLs", () => {
    const r = resolveTarget("file:///tmp/out.html");
    expect(r.kind).toBe("file");
    expect(r.isLocal).toBe(true);
    expect(r.url).toBe("file:///tmp/out.html");
  });

  it("converts a local path to a file:// URL", () => {
    const r = resolveTarget("./index.html");
    expect(r.kind).toBe("file");
    expect(r.url.startsWith("file://")).toBe(true);
  });

  it("throws on empty target", () => {
    expect(() => resolveTarget("")).toThrow();
    // @ts-expect-error testing null
    expect(() => resolveTarget(null)).toThrow();
  });

  it("isUrl distinguishes the two", () => {
    expect(isUrl("https://x.com")).toBe(true);
    expect(isUrl("./x.html")).toBe(false);
  });
});
