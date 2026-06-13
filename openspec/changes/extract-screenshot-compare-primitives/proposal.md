## Why

Design Distill's value proposition — "code that actually matches the source" — depends on a robust, portable pipeline that can extract design tokens, capture pixels, and measure fidelity. Today that pipeline is fragile and non-portable: it shells out to an unpinned `npx dembrandt` (a pre-1.0 tool that shipped 12 releases in 3 weeks) that hard-crashes when its Playwright browser is missing, and it hard-codes `/browse` — a *separate skill* that exists only in the author's environment — for every screenshot. An end user who runs `npx skills add` gets a skill that breaks on first use. There is also no single, reusable engine for the three operations the whole product is built on, so capabilities (drift detection, output verification, multi-viewport capture) are either missing or each reimplemented ad hoc.

This change builds the robust foundation that every downstream capability (closed visual loop, comprehensive extraction, slimmed CLI) depends on.

## What Changes

- Introduce three reusable, robust primitives as skill-bundled scripts, each usable against a **live URL or a local `file://` artifact**:
  - **extract** — design tokens, wrapping a *pinned* dembrandt with a `getComputedStyle` fallback; never hard-crashes.
  - **screenshot** — full-page, multi-viewport (desktop/mobile), light/dark capture via a bundled Playwright script. Works for both source sites and locally generated output.
  - **compare** — structured, per-category, thresholded diff between two token sets; the single engine behind both drift-detection and generated-output verification.
- Add a **capability-probe + bulletproof bootstrap** layer: detect what rendering/extraction capability is available, auto-install Chromium when missing (or emit one clear command instead of Playwright's raw stack trace), and degrade across explicit tiers (full → basic → token-only) so the skill **never hard-crashes**.
- **BREAKING (skill behavior):** Remove the hard dependency on the external `/browse` skill from `design-distill` and `design-apply`. All screenshots route through the bundled `screenshot` primitive. No assumption about the user's environment beyond one self-contained browser dependency.
- **Pin dembrandt** to a known-good version instead of floating `npx dembrandt` to latest, insulating the project from the tool's rapid 0.x API churn.

## Capabilities

### New Capabilities
- `design-extraction`: Extract a structured design-token set from any target (live URL or local `file://`), wrapping pinned dembrandt with a native `getComputedStyle` fallback and graceful degradation.
- `visual-capture`: Capture full-page, multi-viewport, light/dark screenshots of any target (source site or locally generated output) through a self-contained browser, with no dependency on any external skill.
- `design-comparison`: Compare two token sets and produce a structured, per-category, thresholded delta report — the shared engine for source-drift detection and generated-output verification.
- `environment-bootstrap`: Probe available rendering/extraction capabilities, install or repair the browser dependency without cryptic failures, and select an explicit capability tier so operations degrade rather than crash.

### Modified Capabilities
<!-- None: the foundation introduces new engines. CLI slimming and skill-flow changes are separate downstream changes. -->

## Impact

- **Skills:** `skills/design-distill/SKILL.md` and `skills/design-apply/SKILL.md` stop invoking `/browse`; they call the bundled primitives instead. (Full flow rewrites land in downstream changes.)
- **New code:** `skills/*/scripts/` (or a shared `scripts/` consumed by both skills) gains `extract`, `screenshot`, `compare`, and a `setup`/probe entry point.
- **Dependencies:** dembrandt becomes a pinned, optional-at-runtime helper (not a floating hard dependency); Playwright/Chromium becomes the single explicit browser dependency, installed via a bulletproof bootstrap. The external `/browse` skill is no longer required.
- **Downstream:** `close-visual-loop`, `comprehensive-extraction`, and `slim-cli-to-skill-scripts` all build on these primitives.
- **Portability:** Restores genuine out-of-the-box behavior for open-source consumers — install the skill, run bootstrap once, and it works without replicating the author's toolbox.
