## Why

Distillation today captures a thin slice: a single homepage, light mode only, and a small subset of what dembrandt actually returns. That is the other half of "distill 不准" — not just *how* tokens are stored (fixed by `structured-design-store`) but *how little* is captured. dembrandt already exposes multi-page crawl, dark-mode, mobile, WCAG contrast, framework/icon detection, and authenticated extraction; the foundation's `extract` primitive can carry it; we just don't use it. Capturing the full design system — both color schemes, multiple representative pages, component states, framework/icon context, and a contrast audit — is what makes a distilled system trustworthy and generation faithful.

## What Changes

- **Multi-page extraction:** crawl representative pages (e.g., home + pricing + docs/app) and merge tokens, instead of homepage-only. Use dembrandt `--crawl`/`--sitemap`.
- **Light + dark capture:** extract both color schemes (`--dark-mode`) and record both variants in the structured set, instead of assuming one mode.
- **Responsive capture:** extract at desktop and mobile viewports (`--mobile`) and record breakpoints.
- **Framework & icon context:** record detected CSS framework (Tailwind/shadcn/MUI/…) and icon system, so generation matches the source's component conventions.
- **WCAG contrast audit:** run a contrast check (`--wcag`) over the semantic palette and record pass/fail per text-on-surface pair, surfacing accessibility issues at distill time.
- **Authenticated extraction:** support cookies/headers (`--cookie`/`--header`) to distill logged-in pages (e.g., an app dashboard, not just the marketing site).
- **Robustness for hard sites:** apply hydration waits / `--slow` for JS-heavy sites and handle cookie-walls; degrade clearly when a page can't be analyzed (canvas/WebGL).

## Capabilities

### New Capabilities
- `comprehensive-token-capture`: Capture a complete design system across multiple pages, both color schemes, and multiple viewports, including framework/icon detection, authenticated pages, and hard-site robustness, merged into the structured token set.
- `accessibility-audit`: Run a WCAG contrast audit over the semantic palette during distillation and record per-pair pass/fail results in the design system.

### Modified Capabilities
<!-- None: the new extraction modes are additive and captured as the comprehensive-token-capture capability, layered over the foundation's design-extraction. design-distill flow changes are under Impact. -->>

## Impact

- **Depends on:** `extract-screenshot-compare-primitives` (the `extract` primitive) and `structured-design-store` (the structured set + semantic roles to attach new fields to).
- **Code:** `extract` primitive grows extraction modes; the structured schema gains light/dark variants, breakpoints, framework/icon, and WCAG results fields; `design-distill` SKILL drives the richer capture.
- **Cost/time:** multi-page + dual-scheme + multi-viewport extraction is slower; gate the heavier modes behind options/heuristics and the capability tier.
- **Downstream:** richer structured data improves `close-visual-loop` comparison fidelity and `design-apply` output.
- **Out of scope:** CLI slimming and frontmatter polish (`slim-cli-to-skill-scripts`).
