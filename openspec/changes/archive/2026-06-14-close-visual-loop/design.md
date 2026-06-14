## Context

`design-apply` today ends with a Step 5 "self-check" — the model eyeballs its own code against a checklist without ever rendering, screenshotting, or measuring the output. That open loop is where AI UIs drift, and it is precisely the gap upstream `dembrandt-skills` also leaves open. With `screenshot` + `compare` from the foundation and a measurable structured reference from `structured-design-store`, we can replace the checklist with a real closed loop.

## Goals / Non-Goals

**Goals:**
- Close the loop: render → capture → extract → compare → iterate, bounded and convergent.
- Make the gate **quantified** (fidelity score + per-category deltas), not prose.
- Produce auditable reference-vs-output evidence.
- Degrade gracefully to a structured self-check on the token-only tier.

**Non-Goals:**
- Building the primitives themselves (foundation change) or the structured store/normalization (`structured-design-store`).
- Extraction breadth (`comprehensive-extraction`).
- A general-purpose visual-regression framework — this verifies output against one saved design system.

## Decisions

### D1: Reuse the primitives; the loop is orchestration, not new extraction/capture
The loop composes `screenshot`, `extract`, and `compare`; it adds rendering + iteration control only. **Why:** keeps one engine for measurement (shared with `diff`), avoids divergent comparison logic. **Alternative:** a bespoke pixel-diff — rejected; token-level comparison is more actionable ("primary is wrong") than raw pixel deltas and reuses existing logic.

### D2: Token-level comparison drives iteration; screenshots are evidence + tonal check
Iteration decisions come from `compare`'s structured deltas/score; screenshots provide auditable evidence and a coarse tonal/light-dark sanity check. **Why:** structured deltas give the regeneration step concrete, fixable instructions; pixels alone don't say *what* to change. **Alternative:** drive iteration purely from pixel similarity — rejected as un-actionable.

### D3: Render strategy by output type — `file://` first, dev server when needed
Static artifacts render via `file://`; framework projects spin a local dev server and capture the served URL, then tear it down. **Why:** most apply outputs (single-page artifacts) are static and cheap; framework projects need a real serve to render. **Alternative:** always run a dev server — rejected as heavy for the common static case.

### D4: Bounded + convergent, never infinite
Cap iterations and stop when a pass is achieved or no improvement occurs. **Why:** each iteration costs a render+capture+extract+compare; unbounded loops are a runaway cost and can oscillate. Report best-so-far on cap.

### D5: Degrade, never block
On the token-only tier, do the structured self-check that is possible and clearly mark visual verification as skipped. **Why:** consistent with the foundation's never-crash stance; a missing browser must not break apply.

## Risks / Trade-offs

- **Dev-server rendering is fragile/slow for arbitrary projects** → scope framework support conservatively; on serve/build failure, surface it as feedback and fall back to the static/structured path rather than hanging.
- **Extracting tokens from one's own generated output may be sparse** (small page → few tokens) → weight comparison by the roles the output actually uses; do not penalize absence of tokens the page legitimately doesn't use.
- **Iteration can oscillate** (fix A breaks B) → convergence rule stops on non-improvement; report best result, not last.
- **Cost per apply rises** → cap + early-convergence + the static-first render path bound it; the loop only runs at the full tier.
- **Threshold tuning** → start with a conservative default threshold and expose it; record the achieved score so users can calibrate.

## Migration Plan

1. Implement render handling (static `file://`; optional dev-server path) on top of the `screenshot` primitive.
2. Implement the loop controller: extract output → `compare` vs saved system → decide pass/iterate → feed deltas to a fix step → repeat under cap/convergence.
3. Produce side-by-side evidence (reference + output screenshots + delta/score report).
4. Replace `design-apply` Step 5 self-check with the loop; wire tier-based degradation.
5. Validate on the 5 bundled styles: generate a known page, confirm the loop catches and corrects an injected violation (e.g., off-palette primary).

Rollback: revert the `design-apply` step to the prior checklist; the loop is additive orchestration over existing primitives.

## Open Questions

- Default fidelity threshold and per-category weights (calibrate against bundled styles).
- Default iteration cap (e.g., 3) and the "no meaningful improvement" delta epsilon.
- Which framework dev-server commands to auto-detect vs. require the user to specify.
- Where to persist evidence (temp vs. a run artifacts dir) and whether to keep it after success.
