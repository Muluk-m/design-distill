## Context

Design Distill is a **skill**, not a standalone product; its CLI exists only to assist distillation. Today the skill is not portable: it shells out to an unpinned `npx dembrandt` (pre-1.0, 12 releases in 3 weeks) that crashes when Playwright's Chromium is absent, and it hard-codes `/browse` — a separate skill present only in the author's environment — for every screenshot. The three operations the whole product rests on (extract tokens, capture pixels, measure fidelity) have no single robust implementation, so downstream capabilities are missing or reimplemented ad hoc.

This change builds the foundation: three reusable primitives plus a bootstrap/probe layer, all skill-bundled and self-contained, so every downstream capability (`close-visual-loop`, `comprehensive-extraction`, `slim-cli-to-skill-scripts`) composes them instead of reinventing them.

Key external facts (dembrandt 0.18.0, verified):
- `dembrandt-mcp` exposes seven **token-only** tools — no screenshot, no DESIGN.md export.
- Screenshots (`--screenshot`) are **CLI-only and viewport-only**; exports (`--design-md`, `--dtcg`) are CLI-only.
- dembrandt and our screenshots both ultimately need Playwright/Chromium → exactly **one** underlying browser dependency.

## Goals / Non-Goals

**Goals:**
- One robust spine of three primitives — `extract`, `screenshot`, `compare` — each working against a **live URL or a local `file://` artifact**.
- A capability-probe + bulletproof bootstrap so the skill **never hard-crashes**; it degrades across explicit tiers (full → basic → token-only).
- Remove the `/browse` dependency; route all capture through the bundled `screenshot` primitive.
- Pin dembrandt; treat it as an optional-at-runtime token source with a native fallback.
- Self-contained: install the skill, run bootstrap once, it works — no replicating the author's toolbox.

**Non-Goals:**
- Rewriting the `design-distill` / `design-apply` end-to-end flows (downstream changes).
- The closed visual-loop iteration logic itself (`close-visual-loop` consumes these primitives).
- Multi-page / dark-mode / auth extraction breadth (`comprehensive-extraction`).
- Deleting the self-built CLI surface (`slim-cli-to-skill-scripts`).
- Reimplementing dembrandt's statistical token mining from scratch.

## Decisions

### D1: Three primitives as skill-bundled scripts, not a published CLi
`extract`, `screenshot`, `compare` live under the skill (`scripts/`) and are invoked via Bash with relative paths. **Why:** skill best practice favors bundled deterministic scripts over a separately-published global CLI that requires `npx … init`; it keeps the skill self-contained and portable. **Alternative considered:** keep the global `design-distill` CLI — rejected for this foundation because it adds an install step and is the user's first friction point; CLI slimming is handled downstream.

### D2: Uniform `target` contract — live URL or `file://`
Every primitive accepts the same target abstraction. **Why:** it makes "extract/screenshot my generated output" identical to "extract/screenshot the source," which is what lets `compare` power both drift-detection and output-verification with one engine. **Alternative:** separate source-only and output-only paths — rejected as duplicative and the root of today's ad-hoc reimplementation.

### D3: `extract` = pinned dembrandt + native `getComputedStyle` fallback
dembrandt is the preferred source for its frequency-ranked statistical tokens (base-unit inference, etc.) and its **per-color confidence scoring** (high/medium/low), pinned to a known-good version. When it is missing/errors/empty, fall back to a bundled `getComputedStyle` extractor. **Why:** keeps dembrandt's unique value without betting portability on a churning 0.x tool; guarantees a result even when dembrandt is absent. **Alternatives:** (a) own all extraction — rejected now (reimplements ~191 commits of statistical work); (b) consume `dembrandt-mcp` — rejected as the *default* because MCP is token-only (no screenshot/export) and requires user config, undermining out-of-the-box. MCP stays a documented power-user enhancement.

Source precedence: **MCP (if configured) → pinned CLI → native fallback.** When MCP is used, follow dembrandt-mcp's **async job protocol** (submit → poll `get_job_status` → read result), mirroring the upstream `dembrandt-skills` convention; never treat the initial job handle as the result. Preserve confidence scores through the pipeline so downstream consumers can prioritize high-confidence brand tokens.

> Positioning note: upstream `dembrandt-skills` already covers token extraction and token→spec, but has **no screenshot/visual-verification layer and no bootstrap/degradation**. We stay an **independent** project that borrows upstream conventions (rich frontmatter, MCP async protocol, confidence scoring, semantic-token normalization, WCAG gate) while keeping our differentiator — pixels as ground truth + closed visual loop + a saved DESIGN.md library — which upstream lacks. Borrowings that touch the primitives land here (MCP async, confidence); the rest land in their downstream changes.

### D4: `screenshot` = Playwright, reusing whatever browser the user already has
A small Playwright script does full-page, multi-viewport, light/dark capture for both URLs and `file://`. **Why:** dembrandt's screenshot is viewport-only and source-only (too weak). Browser source is resolved in order **CDP endpoint (`DESIGN_DISTILL_CDP`/`BROWSER_CDP_ENDPOINT`) → Playwright's bundled Chromium → system Chrome/Edge via `channel`** — so a user who already has Chrome pays **no download** (validated: a machine with system Chrome probes `tier: full` without installing). Drops `/browse` entirely. **Alternatives:** dembrandt `--screenshot` (insufficient); always-download-our-own (wasteful when a browser exists — rejected); keep `/browse` (non-portable).

### D5: `compare` is one engine for drift and output verification
A single comparator takes two token sets and emits per-category, thresholded deltas plus a quantified fidelity score. **Why:** drift (saved vs live) and verification (output vs saved) are the same operation; unifying them makes the visual loop **objective and measurable** instead of a vibes checklist, and replaces today's colors-only `diff`. Reuses the existing `color.ts` deltaE logic.

### D6: Structured-first data, prose as a view
Primitives emit JSON with a stable shape; DESIGN.md becomes a rendered view of structured data rather than the canonical store that must be regex-parsed back. **Why:** today's "write prose → re-parse with a 135-line regex parser" is a lossy round-trip and the source of inaccuracy. (Full DESIGN.md restructuring is `structured-design-store`; this change only fixes the primitive output contract so downstream work has clean inputs.)

### D7: Bootstrap probes, installs, and tiers — never crashes
A bootstrap entry point probes capabilities, auto-installs Chromium when missing (or prints one remediation command, not a stack trace), and selects an explicit tier. Skills read the tier and announce degradation. **Why:** the current failure mode (raw Playwright trace, hard crash) is the worst possible out-of-the-box experience. **Alternative:** lazy per-call checks — rejected as scattered and hard to message coherently.

## Risks / Trade-offs

- **Chromium download (~150MB) is unavoidable for full fidelity** → bootstrap makes the install one explicit, well-messaged step; token-only tier keeps the skill usable while the user decides.
- **Pinned dembrandt drifts behind upstream** → pin is a deliberate stability choice; bumping the pin is a small, reviewable change, insulated from silent breakage.
- **`file://` rendering differs from a real dev server for React/Next output** → this change targets static/`file://` capture; rendering app frameworks via a dev server is layered in `close-visual-loop`.
- **Native `getComputedStyle` fallback is weaker than dembrandt** → acceptable: it is a degraded tier, clearly announced, not the default.
- **Probe complexity could itself fail** → probe is defensive (treat any uncertainty as "capability absent" → lower tier) so the failure mode is degradation, never a crash.

## Migration Plan

1. Land the three primitives + bootstrap as bundled scripts with their own tests; nothing else consumes them yet (no behavior change for existing flows).
2. Repoint `design-distill` / `design-apply` screenshot steps from `/browse` to the `screenshot` primitive; remove `/browse` references.
3. Verify on a fresh environment (no `/browse`, no Chromium): bootstrap installs Chromium and the skill runs; with install declined, it degrades to token-only with a clear warning.
4. Downstream changes build on the primitives.

Rollback: the primitives are additive; reverting the SKILL.md repoint restores prior behavior.

## Open Questions

- Script runtime/language for the bundled primitives (reuse the existing TS/tsdown toolchain vs. plain `.mjs` for zero-build portability)?
- Exact dembrandt pin version and the bump policy (manual review per bump assumed).
- Where the structured token JSON is cached/persisted for `compare` reuse (resolved fully in `structured-design-store`).
