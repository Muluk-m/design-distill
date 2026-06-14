## 1. Structured schema (design-token-model)

- [x] 1.1 Define the canonical structured schema: token set + namespaced extensions for semantic roles, essence, decisions (component states / motion / voice-tone fields render when populated by `comprehensive-extraction`)
- [x] 1.2 Define the per-style on-disk layout (`~/.config/design-distill/<name>/`): `tokens.json` (canonical) + rendered `DESIGN.md` (written by `build-design.mjs`)
- [x] 1.3 Document that the structured file is canonical and `DESIGN.md` is always regenerated (header comment in build-design.mjs + SKILL note)

## 2. Semantic normalization (semantic-normalization)

- [x] 2.1 Implement raw structured tokens + confidence → semantic role assignment (primary/secondary/surface/surface-raised/border/text/text-secondary/error/warning/success)
- [x] 2.2 Implement decision rule: highest interactive-usage (button bg) + confidence + saturation wins `color-primary` when brand colors compete
- [x] 2.3 Implement guardrails: body text floored at 16px; type sizes rounded to a coherent modular scale (base 16, ratio 1.25)
- [x] 2.4 Implement reserved status hues (error=red, warning=distinct amber; brand-orange cannot double as warning)
- [x] 2.5 Derive spacing base unit and `radius-button`/`radius-card`
- [x] 2.6 Record every assignment/override decision in the structured set for inspectability (`tokens.json.decisions`)
- [x] 2.7 Tests: one per decision rule + idempotence + confidence-weighted assignment + brand-orange guard

## 3. Essence layer + document template (design-document)

- [x] 3.1 Implement essence derivation (≤5 defining traits) from dominant tokens + depth/corner language
- [x] 3.2 Expand the DESIGN.md template: essence, semantic colors, raw palette, typography scale, spacing, radius, elevation, components, anti-patterns, decisions (component states / responsive / motion / light-dark / voice-tone render when those fields are populated by `comprehensive-extraction`)
- [x] 3.3 Implement the renderer: structured set → `DESIGN.md` (`render-design.mjs`)
- [x] 3.4 Tests: essence bounded ≤5, dark-tone + flat-depth detection, roles/anti-patterns/decisions rendered, header

## 4. Repoint consumers & remove regex re-parse

- [x] 4.1 New pipeline (`build-design`/`compare`) reads the structured set directly — no prose re-parse
- [x] 4.2 `preview` (scripts/preview.mjs) reads the structured `tokens.json` (done in slim-cli-to-skill-scripts)
- [x] 4.3 `diff` (scripts/diff.mjs) reads the structured set + delegates to `compare` (done in slim-cli-to-skill-scripts)
- [x] 4.4 `src/lib/parsers.ts` deleted (with the rest of the legacy `src/`)

## 5. Migrate styles & skills

- [x] 5.1 Evaluated regenerating the 5 bundled styles live (dembrandt now works) — DECISION: do NOT auto-migrate the curated bundles. Live evidence (e.g. Stripe) shows auto-distill produces sparser, lower-quality output than the hand-tuned DESIGN.md; overwriting would regress curated assets. Structured-first (tokens.json) applies to NEW distills going forward.
- [x] 5.2 Verified the regression by diffing a live re-distill (Stripe) against the hand-tuned reference — auto output is materially thinner; curated bundles kept as-is. design-apply falls back to reading the curated `DESIGN.md` (Priority 2) for bundled styles with no tokens.json.
- [x] 5.3 Update `design-distill` SKILL to write structured-first (pipe extract → build-design → tokens.json + DESIGN.md)
- [x] 5.4 Update `design-apply` SKILL to read semantic roles + essence from tokens.json (falls back to DESIGN.md prose when absent)
- [x] 5.5 Existing library entries remain readable: new distills are structured-first; curated/legacy DESIGN.md-only entries are read directly (no destructive one-shot migration that would degrade curated styles)

## 6. Verification

- [x] 6.1 End-to-end: extract a target → `build-design` → structured set with semantic roles + essence + decisions (verified on local fixture: 6 roles, 5-trait essence, 7 decisions)
- [x] 6.2 No consumer parses prose; `parsers.ts` is gone (entire legacy `src/` removed)
- [x] 6.3 New structured pipeline + renderer covered by unit tests (semantic, essence, render-design)
