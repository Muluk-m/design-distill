## Why

The product's core promise — "code that actually looks like the source" — is delivered by an **open loop**: `design-apply` generates code and then "self-checks" against a mental checklist, but it never renders its own output, never screenshots it, and never measures it against the source. AI UIs drift exactly at this step. Upstream `dembrandt-skills` has no visual verification at all, so this loop is our differentiator. Now that the foundation provides `screenshot` and `compare`, and the structured store provides a measurable reference, we can close the loop: render the generated output, extract and screenshot it, compare it to the saved design system, and iterate until it converges.

## What Changes

- Add a **closed visual-verification loop** to `design-apply`: after generation, **render** the output, **screenshot** + **extract** it, **compare** it to the saved structured design system, and **iterate** on the deltas until a fidelity threshold is met or an iteration cap is reached.
- **Render generated output** for verification: static/`file://` artifacts directly; framework output (React/Next/etc.) by spinning a local dev server and capturing the served URL.
- **Quantified gate, not vibes:** the loop uses `compare`'s per-category deltas and overall fidelity score to decide pass/iterate, replacing the current checklist-only self-check.
- **Side-by-side evidence:** capture reference vs. output screenshots (and the delta report) so the result is auditable.
- **Bounded + graceful:** cap iterations, converge on "no further improvement," and respect capability tiers — when no browser is available (token-only tier), fall back to the structured self-check and clearly state that visual verification was skipped.

## Capabilities

### New Capabilities
- `visual-verification-loop`: Render → capture → extract → compare → iterate generated output against a saved design system until a fidelity threshold or iteration cap is reached, producing auditable side-by-side evidence and degrading gracefully when rendering is unavailable.

### Modified Capabilities
<!-- design-apply's flow is defined in SKILL.md, not an existing spec; changes captured under Impact. -->

## Impact

- **Depends on:** `extract-screenshot-compare-primitives` (screenshot + compare + tiers) and `structured-design-store` (measurable reference + semantic roles).
- **Skills:** `design-apply` gains the post-generation loop; its Step 5 "self-check" is replaced by the quantified loop. `design-distill` is unaffected.
- **Rendering:** introduces local-render handling for generated output, including an optional dev-server path for framework projects.
- **Performance:** each iteration runs a render + capture + extract + compare; the iteration cap and convergence rule bound cost.
- **Out of scope:** broadening extraction breadth (`comprehensive-extraction`) and CLI slimming (`slim-cli-to-skill-scripts`).
