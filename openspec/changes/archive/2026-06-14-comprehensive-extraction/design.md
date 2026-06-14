## Context

Distillation captures a homepage in light mode and uses only a fraction of dembrandt's output. dembrandt 0.18 already offers `--crawl`/`--sitemap`, `--dark-mode`, `--mobile`, `--wcag`, framework/icon detection, `--cookie`/`--header`, and `--slow`; the foundation's `extract` primitive can carry them and the structured store can hold the richer fields. This change turns on the breadth — the "captures too little" half of "distill 不准" — and adds a contrast audit, borrowing upstream's accessibility emphasis.

## Goals / Non-Goals

**Goals:**
- Capture across multiple pages, both schemes, and multiple viewports; record framework/icon context.
- Support authenticated pages and hard (JS-heavy/slow) sites; degrade clearly for unanalyzable content.
- Run a WCAG contrast audit at distill time and record results.

**Non-Goals:**
- Changing the storage model or normalization (`structured-design-store`).
- The visual loop (`close-visual-loop`) — though richer capture improves its comparisons.
- Remediating contrast failures (that is generation's job); distillation only records.
- CLI slimming / frontmatter (`slim-cli-to-skill-scripts`).

## Decisions

### D1: Extend the `extract` primitive with modes; merge happens in structured space
Add multi-page/dark/mobile/auth/slow modes to `extract`; merge multiple extractions into one structured set using the `structured-design-store` schema. **Why:** keeps one extraction path and one merge representation rather than parallel pipelines. **Alternative:** a separate "deep extract" tool — rejected as duplicative.

### D2: Heavier modes are opt-in / heuristic-gated, not always-on
Multi-page, dual-scheme, and multi-viewport multiply cost; enable them via options or simple heuristics (e.g., detect a dark-mode toggle before running `--dark-mode`) and respect the capability tier. **Why:** a default that always crawls 5 pages × 2 schemes × 2 viewports is slow and often wasteful. **Alternative:** always-max — rejected on cost.

### D3: Light/dark stored as variants, not flattened
Record both schemes as distinct variants in the structured set (matching `structured-design-store`'s variant fields). **Why:** flattening loses the per-scheme palette that generation needs to honor the right mode. **Alternative:** keep only the "primary" scheme — rejected; it reintroduces the light/dark guessing error.

### D4: WCAG audit records, does not remediate
The audit annotates the distilled system with ratios + pass/fail and reports failures, but never edits source token values. **Why:** distillation's job is faithful capture; "fixing" contrast would misrepresent the source. Remediation is a generation-time concern. **Alternative:** auto-correct failing colors — rejected; corrupts the recorded source.

### D5: Honest degradation for unanalyzable content
For canvas/WebGL or pages that won't render, report "not extractable" rather than emitting fabricated tokens. **Why:** a fabricated value is worse than a recorded gap — it silently poisons generation.

## Risks / Trade-offs

- **Cost/time blow-up from combinatorial modes** → opt-in + heuristic gating + tier-awareness; document expected runtime per mode.
- **Multi-page merge conflicts** (pages disagree on a token) → resolve by frequency/confidence (consistent with normalization), and record provenance so conflicts are inspectable.
- **dembrandt mode/flag drift across versions** → all modes go through the pinned `extract` primitive; a dembrandt bump is one reviewed change, not silent breakage.
- **Auth handling touches credentials** → never persist cookies/headers into the saved design system; treat them as transient inputs only.
- **Dark-mode detection false negatives** → when detection is uncertain, attempt and record absence rather than skipping silently.

## Migration Plan

1. Add extraction modes to the `extract` primitive (crawl/sitemap, dark, mobile, cookie/header, slow).
2. Extend the structured schema usage for light/dark variants, breakpoints, framework, icon, and WCAG results (fields defined in `structured-design-store`).
3. Implement multi-extraction merge (frequency/confidence resolution + provenance).
4. Implement the WCAG contrast audit over the semantic palette; record results.
5. Update `design-distill` SKILL to drive comprehensive capture with opt-in/heuristic gating and tier-awareness.
6. Validate: re-distill the 5 bundled styles with comprehensive capture; confirm richer, correct output (esp. light/dark and framework).

Rollback: modes are additive; disabling them reverts to single-page light-mode capture.

## Open Questions

- Default crawl depth and page-selection heuristic (home + which routes?).
- Heuristic for auto-enabling dark-mode capture (detect toggle/`prefers-color-scheme` handling?).
- Exact WCAG pairs to audit beyond the core three, and whether to include AAA as informational.
- Merge conflict resolution policy details (pure frequency vs. confidence-weighted).
