import { describe, it, expect } from "vitest";
import {
  mapDembrandtJson,
  mapNativeComputed,
  extractTokens,
  isEmptyTokenSet,
  pollMcpJob,
  // @ts-expect-error - plain .mjs module without types
} from "../../scripts/lib/extract-core.mjs";

describe("mapDembrandtJson", () => {
  it("maps palette colors and preserves confidence", () => {
    const ts = mapDembrandtJson({
      colors: {
        palette: [
          { name: "brand", value: "#5e6ad2", confidence: "high" },
          { value: "#08090a", confidence: "low" },
        ],
        semantic: { primary: { value: "#7170ff", confidence: "medium" } },
      },
    });
    expect(ts.colors.brand).toEqual({ value: "#5e6ad2", confidence: "high" });
    expect(ts.colors["palette-2"].confidence).toBe("low");
    expect(ts.colors.primary).toEqual({ value: "#7170ff", confidence: "medium" });
  });

  it("maps typography, spacing, radius, shadows, components", () => {
    const ts = mapDembrandtJson({
      typography: { styles: [{ fontFamily: "Inter", context: "body", fontSize: "16px" }] },
      spacing: { commonValues: ["8px", "16px"], scaleType: "8px" },
      borderRadius: { values: ["4px", "6px"] },
      shadows: ["0 1px 2px rgba(0,0,0,.1)"],
      components: { buttons: [{ background: "#5e6ad2", padding: "0 12px" }] },
    });
    expect(ts.typography.fontFamilies).toContain("Inter");
    expect(ts.typography.scale.body.size).toBe("16px");
    expect(ts.spacing.values).toEqual(["8px", "16px"]);
    expect(ts.radius.values).toEqual(["4px", "6px"]);
    expect(ts.shadows).toHaveLength(1);
    expect(ts.components.button.background).toBe("#5e6ad2");
  });

  it("is defensive against junk input", () => {
    expect(isEmptyTokenSet(mapDembrandtJson(null))).toBe(true);
    expect(isEmptyTokenSet(mapDembrandtJson({ colors: "nope" }))).toBe(true);
  });
});

describe("mapNativeComputed", () => {
  it("builds tokens with unknown confidence", () => {
    const ts = mapNativeComputed({
      cssVariables: { "--accent": "#7170ff" },
      colors: ["rgb(8, 9, 10)"],
      fontFamilies: ["Inter"],
      radius: ["6px"],
      shadows: ["none-ish"],
    });
    expect(ts.colors["--accent"]).toEqual({ value: "#7170ff", confidence: "unknown" });
    expect(ts.typography.fontFamilies).toContain("Inter");
  });
});

describe("extractTokens precedence", () => {
  const good = { colors: { primary: { value: "#5e6ad2", confidence: "high" } } };

  it("uses mcp when it returns tokens", async () => {
    const ts = await extractTokens("https://x.com", {
      runners: {
        mcp: async () => good,
        cli: async () => ({ colors: { primary: { value: "#000000" } } }),
        native: async () => null,
      },
    });
    expect(ts.colors.primary.value).toBe("#5e6ad2");
    expect(ts.source.extractor).not.toBe("none");
  });

  it("falls through to cli when mcp is empty", async () => {
    const ts = await extractTokens("https://x.com", {
      runners: {
        mcp: async () => null,
        cli: async () => good,
        native: async () => null,
      },
    });
    expect(ts.colors.primary.confidence).toBe("high");
  });

  it("falls through to native when mcp+cli fail", async () => {
    const ts = await extractTokens("https://x.com", {
      runners: {
        mcp: async () => {
          throw new Error("no mcp");
        },
        cli: async () => null,
        native: async () => ({ colors: { c1: { value: "#abcabc" } } }),
      },
    });
    expect(ts.colors.c1.value).toBe("#abcabc");
  });

  it("returns a normalized empty set when nothing works (never throws)", async () => {
    const ts = await extractTokens("https://x.com", {
      runners: { mcp: null, cli: async () => null, native: async () => null },
    });
    expect(isEmptyTokenSet(ts)).toBe(true);
    expect(ts.source.extractor).toBe("none");
  });
});

describe("pollMcpJob async protocol", () => {
  it("submits then polls until completed", async () => {
    let polls = 0;
    const client = {
      submit: async () => ({ job_id: "job_1", status: "queued" }),
      status: async () => {
        polls += 1;
        return polls < 2 ? { status: "running" } : { status: "completed", result: { ok: true } };
      },
    };
    const result = await pollMcpJob(client, { maxPolls: 5 });
    expect(result).toEqual({ ok: true });
    expect(polls).toBe(2);
  });

  it("returns null when the job fails", async () => {
    const client = {
      submit: async () => ({ job_id: "job_2" }),
      status: async () => ({ status: "failed" }),
    };
    expect(await pollMcpJob(client)).toBeNull();
  });

  it("returns null when no client is wired (script context)", async () => {
    expect(await pollMcpJob(null)).toBeNull();
  });
});
