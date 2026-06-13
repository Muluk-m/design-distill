## Why

Two defects make distilled designs inaccurate and generated UIs "not look like" the source. First, the canonical store is **prose**: distill writes `DESIGN.md`, then a 135-line regex parser (`parsers.ts`) extracts tokens back out for `diff`/`preview` — a lossy round-trip that is the structural cause of inaccuracy. Second, the pipeline feeds **raw extracted values** straight into generation; it never normalizes them into a semantic system, so the model gets "47 colors and 19 radii" with no notion of which is `primary` vs incidental, and no guardrails (e.g., body text below 16px, three competing brand colors). Upstream `dembrandt-skills` solves the second problem with an explicit normalization + decision layer we currently lack.

This change makes the store structured-first and adds the semantic-normalization layer, directly targeting the "不准 / 不像" complaints.

## What Changes

- **Invert the data model:** a canonical **structured token set (JSON, DTCG-aligned)** becomes the source of truth; `DESIGN.md` becomes a **rendered view** of it. **BREAKING (storage):** saved styles gain a structured artifact alongside `DESIGN.md`; the regex re-parse path (`parsers.ts`) is removed in favor of reading structured data directly.
- **Add a semantic-normalization layer:** map raw extracted tokens to **semantic roles** (`color-primary`, `color-surface`, `color-surface-raised`, `color-border`, `color-text`, `color-text-secondary`, `color-error`, `color-warning`, `color-success`; spacing base unit; `radius-button`/`radius-card`; modular type scale) using **explicit decision rules** borrowed and adapted from upstream (highest interactive-usage wins `primary`; body text floored at 16px; type sizes rounded to a coherent modular scale; error/warning hues reserved). Consume the **confidence scores** from the extract primitive to prioritize high-confidence brand tokens.
- **Add an "essence" layer:** capture the 3–5 traits that actually define the look (e.g., "near-black bg + Inter 510 + depth via background tiers, not shadows") so generation has a priority signal instead of drowning in detail.
- **Enrich the DESIGN.md template:** component states (rest/hover/active/focus/disabled/loading), responsive breakpoints, motion tokens, light/dark variants, voice/tone, and explicit anti-patterns — rendered from the structured set.
- **Migrate** the 5 bundled styles and the saved-library format to the new structured-first layout.

## Capabilities

### New Capabilities
- `design-token-model`: A canonical, structured (DTCG-aligned JSON) token set as the single source of truth for a saved design system, from which `DESIGN.md` is rendered; removes the prose→regex round-trip.
- `semantic-normalization`: Deterministic mapping from raw extracted tokens to semantic roles via explicit, documented decision rules, using extract confidence scores.
- `design-document`: The `DESIGN.md` rendered view plus a comprehensive template (essence, semantic tokens, component states, responsive, motion, light/dark variants, voice/tone, anti-patterns).

### Modified Capabilities
<!-- None mapped to existing specs; parsers.ts removal is captured under Impact (not a spec'd capability). -->

## Impact

- **Depends on:** `extract-screenshot-compare-primitives` (consumes the extract primitive's structured output + confidence scores).
- **Code:** removes `src/lib/parsers.ts` (regex re-parse); `diff`/`preview`/`compare` read the structured set directly; store gains a structured artifact per style.
- **Storage / data:** `~/.config/design-distill/<name>/` gains a structured token file; `DESIGN.md` is regenerated from it. The 5 bundled styles are migrated.
- **Skills:** `design-distill` writes structured-first and renders `DESIGN.md`; `design-apply` reads semantic roles + essence (improving fidelity).
- **Downstream:** `close-visual-loop` compares against the structured set; `comprehensive-extraction` extends it with multi-page/dark/icon/framework fields.
