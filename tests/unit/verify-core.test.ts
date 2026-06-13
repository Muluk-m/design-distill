import { describe, it, expect } from "vitest";
// @ts-expect-error - plain .mjs module without types
import { decideOutcome, deltasToInstructions, DEFAULT_LOOP } from "../../scripts/lib/verify-core.mjs";

describe("decideOutcome", () => {
  it("passes as soon as a round meets the threshold", () => {
    const r = decideOutcome([70, 90], { threshold: 85, cap: 5 });
    expect(r.action).toBe("pass");
    expect(r.bestScore).toBe(90);
    expect(r.bestRound).toBe(1);
  });

  it("iterates while below threshold and still improving", () => {
    const r = decideOutcome([60, 70], { threshold: 85, cap: 5, epsilon: 2 });
    expect(r.action).toBe("iterate");
  });

  it("stops on convergence when a round does not improve enough", () => {
    const r = decideOutcome([60, 61], { threshold: 85, cap: 5, epsilon: 2 });
    expect(r.action).toBe("stop-converged");
    expect(r.bestScore).toBe(61);
  });

  it("stops at the iteration cap, reporting the best round (not the last)", () => {
    const r = decideOutcome([50, 80, 70], { threshold: 85, cap: 3, epsilon: 2 });
    expect(r.action).toBe("stop-cap");
    expect(r.bestRound).toBe(1);
    expect(r.bestScore).toBe(80);
  });

  it("uses sane defaults", () => {
    expect(DEFAULT_LOOP.threshold).toBeGreaterThan(0);
    const r = decideOutcome([100]);
    expect(r.action).toBe("pass");
  });
});

describe("deltasToInstructions", () => {
  it("turns per-category deltas into actionable fix lines", () => {
    const report = {
      categories: {
        colors: { deltas: [{ token: "color-primary", reference: "#5e6ad2", candidate: "#ff0000" }] },
        radius: { deltas: [{ token: "radius-button", reference: "6px", candidate: null }] },
      },
    };
    const lines = deltasToInstructions(report);
    expect(lines).toHaveLength(2);
    expect(lines[0]).toMatch(/color-primary.*#5e6ad2.*#ff0000/);
    expect(lines[1]).toMatch(/radius-button.*6px.*missing/);
  });

  it("returns nothing when there are no deltas", () => {
    expect(deltasToInstructions({ categories: { colors: { deltas: [] } } })).toEqual([]);
  });
});
