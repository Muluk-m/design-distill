## Context

The saved-style format today is prose-first: `DESIGN.md` is the canonical artifact, and `src/lib/parsers.ts` (135 lines of regex) recovers token values from it for `diff`/`preview`. That round-trip — structured extraction → prose → regex back to structured — loses information and is the structural cause of "不准". Separately, the pipeline feeds raw extracted values into generation with no semantic layer, so the model cannot tell `primary` from incidental and has no guardrails; upstream `dembrandt-skills` fixes this with an explicit normalize-then-decide step that we lack.

This change builds on `extract-screenshot-compare-primitives` (which already emits structured, confidence-scored tokens) by making the **store** structured-first and adding the **normalization** layer between extraction and the document.

## Goals / Non-Goals

**Goals:**
- Make a canonical structured token set (DTCG-aligned JSON) the source of truth; render `DESIGN.md` from it.
- Remove the prose→regex round-trip (`parsers.ts`); all consumers read structured data.
- Add a deterministic semantic-normalization layer (raw → roles) with documented decision rules, using confidence scores.
- Add an essence layer and a comprehensive document template (states, responsive, motion, light/dark, voice/tone, anti-patterns).
- Migrate the 5 bundled styles + saved-library format.

**Non-Goals:**
- Broadening *extraction* breadth (multi-page/dark/auth/icon/framework) — that is `comprehensive-extraction`.
- The visual comparison/iteration loop — that is `close-visual-loop`.
- CLI slimming and frontmatter polish — `slim-cli-to-skill-scripts`.

## Decisions

### D1: DTCG-aligned JSON as the canonical store, DESIGN.md as a view
Persist a structured token file per style; render `DESIGN.md` from it. **Why:** ends the lossy round-trip; aligns with the W3C DTCG shape dembrandt already exports (`--dtcg`), easing interop. **Alternative:** keep prose canonical and improve the parser — rejected; it doubles down on the root defect.

### D2: Normalization is a deterministic, documented function — not model vibes
Encode the role-assignment and guardrail rules (highest interactive-usage → `primary`; body floored at 16px; modular-scale rounding; reserved error/warning hues) as deterministic logic, adapting upstream's rules. **Why:** same input → same semantic system; the rules are reviewable and testable, unlike ad-hoc model judgment. **Alternative:** let the apply skill normalize on the fly each time — rejected as non-deterministic and unverifiable.

### D3: Normalization output is additive, raw values retained
The semantic system is layered *on top of* the raw structured tokens, not a replacement. **Why:** keeps full fidelity for `compare`/audit while giving generation a clean semantic surface; lets us re-normalize if rules improve without re-extracting.

### D4: Essence is derived and bounded (≤5)
Derive the essence from the dominant tokens + anti-patterns and cap it at five. **Why:** the priority signal only works if it stays short; an unbounded "essence" is just another detail dump.

### D5: Do NOT auto-regenerate the curated bundled styles (revised after live evidence)
Originally this planned to re-run the 5 bundled styles through extract → normalize → render. **Live testing reversed this decision:** with dembrandt working, a real Stripe re-distill produced a sparse, deduped palette (≈5 colors) and imperfect roles vs. the rich hand-tuned `DESIGN.md`. Auto-migration would **regress** curated assets we didn't author. **Decision:** keep the curated bundles as hand-tuned `DESIGN.md`; structured-first (`tokens.json`) applies to new distills. `design-apply` reads `tokens.json` when present and falls back to the curated `DESIGN.md` prose otherwise. **Why this is safe:** never overwrites curated work; the new pipeline still governs everything freshly distilled.

## Risks / Trade-offs

- **Migration could degrade the hand-tuned bundled styles** → keep the current prose as a quality reference; diff regenerated output against it and hand-correct deltas before committing.
- **DTCG shape may not cover everything (motion, voice/tone, essence)** → use DTCG for standard tokens and a clearly namespaced extension block for non-DTCG concepts; do not bend DTCG semantics.
- **Deterministic rules can mis-assign on unusual sites** → record every override/assignment decision in the structured set so it is inspectable and correctable; rules are versioned.
- **Two artifacts (JSON + MD) can drift** → JSON is canonical and MD is always regenerated, never hand-edited as the source.

## Migration Plan

1. Define the structured schema (DTCG core + namespaced extensions for semantic roles, essence, states, motion, voice/tone).
2. Implement normalization (raw structured tokens + confidence → semantic system) with tests for each decision rule.
3. Implement the DESIGN.md renderer from the structured set; expand the template.
4. Repoint `diff`/`preview`/`compare` to the structured set; delete `parsers.ts` usage.
5. Migrate the 5 bundled styles; diff against the prior hand-tuned versions and correct.
6. Update `design-distill` (write structured-first) and `design-apply` (read roles + essence).

Rollback: the structured artifact is additive; until `parsers.ts` is deleted, reverting consumers restores prose-based behavior.

## Open Questions

- Exact DTCG extension namespace for semantic roles / essence / motion / voice-tone.
- Whether `radius-card` is derived (`radius-button + 2`) when absent, or left unset.
- Modular-scale base/ratio defaults (upstream suggests base 16px, ratio 1.25) — adopt as default, override when the source is clearly coherent at another ratio.
