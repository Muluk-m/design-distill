## 1. Scaffolding & dependencies

- [x] 1.1 Decide and document the bundled-script runtime (plain `.mjs` for zero-build vs existing TS/tsdown) and create the `scripts/` location consumed by both skills
- [x] 1.2 Pin dembrandt to a known-good version (resolve the floating `npx dembrandt`) and record the pin + bump policy
- [x] 1.3 Add Playwright as the single explicit browser dependency and confirm it is the same Chromium dembrandt uses

## 2. Bootstrap & capability probe (environment-bootstrap)

- [x] 2.1 Implement capability probing: detect a usable browser and a usable extractor; expose the result to skills
- [x] 2.2 Implement bulletproof setup: reuse an existing browser (CDP / system Chrome/Edge / prior Chromium) before installing; auto-install Chromium only when none found; on failure emit a single remediation command, never a raw stack trace
- [x] 2.3 Implement explicit tier selection (full / basic / token-only) from probe results
- [x] 2.4 Ensure no code path requires the external `/browse` skill or any sibling skill
- [x] 2.5 Tests: browser-present → full; browser-missing+installable → installs; install-impossible → clean remediation message; extractor-only → token-only tier

## 3. extract primitive (design-extraction)

- [x] 3.1 Implement the uniform `target` contract (live `http(s)://` and local `file://`)
- [x] 3.2 Wire pinned dembrandt as the preferred token source; emit its frequency-ranked tokens
- [x] 3.3 Implement native `getComputedStyle` fallback for when dembrandt is absent/errors/empty
- [x] 3.4 Emit a single stable-shape JSON result covering colors, typography, spacing, radius, shadows, components
- [x] 3.5 Preserve per-token confidence scoring (high/medium/low) from dembrandt; mark unknown on the native fallback
- [x] 3.6 Implement source precedence MCP → CLI → native; when using MCP, follow the async job protocol (submit → poll `get_job_status` → read result)
- [x] 3.7 Tests: live URL, local `file://`, dembrandt-success, dembrandt-fallback, JSON shape stability, confidence preserved, MCP async poll path, MCP-absent → CLI fallback

## 4. screenshot primitive (visual-capture)

- [x] 4.1 Implement Playwright capture for live URL and local `file://` via one code path
- [x] 4.2 Support full-page capture (not viewport-only)
- [x] 4.3 Support multiple viewports (desktop + mobile) and light/dark color schemes per invocation
- [x] 4.4 Wait for hydration/stabilization; report unrenderable targets instead of emitting blank images
- [x] 4.6 Prefer an existing browser (CDP endpoint / system Chrome/Edge) before downloading our own Chromium
- [x] 4.5 Tests: full-page below-the-fold content, per-viewport outputs, dark-scheme rendering, navigation-failure reporting, works with `/browse` absent (verified against system Chrome)

## 5. compare primitive (design-comparison)

- [x] 5.1 Implement per-category structured delta (colors/typography/spacing/radius/shadows/components) with token + reference + candidate
- [x] 5.2 Apply per-category thresholds; reuse `color.ts` deltaE for perceptual color distance
- [x] 5.3 Emit a quantified overall fidelity signal (score / pass-fail) alongside deltas
- [x] 5.4 Verify one engine serves both drift (saved vs live) and output-verification (output vs saved) with one input contract
- [x] 5.5 Tests: multi-category diff, identical-sets match, sub/over-threshold color cases, drift scenario, output-verification scenario, score output

## 6. Integrate into skills (drop /browse)

- [x] 6.1 Repoint `skills/design-distill/SKILL.md` screenshot steps from `/browse` to the `screenshot` primitive
- [x] 6.2 Repoint `skills/design-apply/SKILL.md` screenshot steps from `/browse` to the `screenshot` primitive
- [x] 6.3 Have both skills read the active tier from bootstrap and announce degradation when below full
- [x] 6.4 Remove all remaining `/browse` references from skill instructions

## 7. End-to-end verification

- [x] 7.1 End-to-end with a real browser (system Chrome, no `/browse`): extract→screenshot→compare runs on a local `file://` fixture (extract got `--brand:#5e6ad2`+Inter; screenshot produced desktop+mobile PNGs)
- [x] 7.2 Decline-install / token-only path: probe reports tier correctly; degrade path verified via `setup.mjs --probe`
- [x] 7.3 Confirm downstream readiness: primitives are independently invokable for `close-visual-loop`, `comprehensive-extraction`, `slim-cli-to-skill-scripts`
