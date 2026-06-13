## 1. Extraction modes (extract primitive)

- [x] 1.1 Add multi-page capture (`--crawl N` / `--sitemap`) — mapped to dembrandt args in extract.mjs
- [x] 1.2 Add dark-mode capture (`--dark-mode`) — second extraction merged as a variant
- [x] 1.3 Add mobile/viewport capture (`--mobile`); breakpoints captured into the token set
- [x] 1.4 Add authenticated extraction (`--cookie` / `--header`), passed through as transient args (never persisted)
- [x] 1.5 Add hard-site robustness (`--slow`); native path reports unextractable content rather than fabricating
- [x] 1.6 Live-verified: dembrandt extraction works end-to-end (Stripe), modes run (dark-mode dual-scheme merge on Linear → base + dark variant), plus unit tests for arg-mapping/merge/meta

## 2. Merge & schema fields

- [x] 2.1 Implement multi-extraction merge (confidence/frequency resolution + provenance `source.pages`) — merge.mjs
- [x] 2.2 Store light/dark as distinct variants (`variants.dark` / `variants.light`), not flattened
- [x] 2.3 Store breakpoints, detected framework, and icon system (token set `breakpoints` + `meta`)
- [x] 2.4 Tests: conflict resolution (higher confidence wins), unions, dark variant kept (merge.test.ts)

## 3. Framework & icon detection

- [x] 3.1 Surface dembrandt's detected framework into `meta.framework`
- [x] 3.2 Surface detected icon system into `meta.iconSystem`
- [x] 3.3 Rendered in DESIGN.md "Tech context" section (mapping covered by extract-core mapping; values present when dembrandt detects them)

## 4. Accessibility audit (accessibility-audit)

- [x] 4.1 WCAG contrast audit over the semantic palette (text/surface, text-secondary/surface, primary) — wcag.mjs, run in build-design
- [x] 4.2 Record ratios + AA pass/fail in the structured set (`accessibility`) and render them
- [x] 4.3 Report failures WITHOUT mutating source token values
- [x] 4.4 Tests: black/white=21:1, low-contrast failure flagged, source unchanged, no-surface skips (wcag.test.ts)

## 5. Gating & integration

- [x] 5.1 Heavier modes are opt-in flags (crawl/dark/mobile/slow) — default extraction stays single-page light
- [x] 5.2 `design-distill` SKILL drives extraction; comprehensive flags documented in extract.mjs usage
- [x] 5.3 Documented per-mode runtime/cost rule-of-thumb in the design-distill SKILL (comprehensive capture section)

## 6. Verification

- [x] 6.1 Comprehensive capture verified live (Stripe extract+normalize+WCAG; Linear dark-mode variants). Bundled re-distill intentionally NOT performed — it regresses the curated hand-tuned styles (see structured-design-store D5).
- [x] 6.2 Authenticated extraction: `--cookie`/`--header` pass-through implemented + unit-tested; credentials never persisted. Accepted by rationale — a live authed-page run requires user-provided credentials (no target available in this environment).
- [x] 6.3 Cost gating verified by design: default capture is single-page light; max capture is opt-in via flags; WCAG audit + merge verified end-to-end on a local fixture
