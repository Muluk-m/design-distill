## 1. Render generated output

- [x] 1.1 Render static/`file://` artifacts via the `screenshot` primitive (used by verify.mjs)
- [x] 1.2 Detect framework projects and render via a local dev server (detectDevCommand + extractServerUrl + startDevServer; wired into verify.mjs, tears down after) — scripts/lib/devserver.mjs, tested
- [x] 1.3 Surface render/build/serve failures as actionable feedback (capture throws → reported, no silent pass)
- [x] 1.4 Tests: static artifact render + render-failure reporting (integration/screenshot.test.ts)

## 2. Loop controller

- [x] 2.1 Extract tokens from rendered output via the `extract` primitive (verify.mjs)
- [x] 2.2 Compare output tokens to the saved structured system via `compare`; obtain per-category deltas + fidelity score
- [x] 2.3 Decide pass (score ≥ threshold) vs iterate (emit specific deltas as fix instructions)
- [x] 2.4 Enforce iteration cap and early-convergence (stop on no meaningful improvement); report best-so-far (decideOutcome)
- [x] 2.5 Weight comparison by roles the output actually uses (compare only scores reference tokens; candidate extras not penalized)
- [x] 2.6 Tests: pass-on-threshold, iterate-on-deltas, cap reached, convergence, best-not-last (verify-core.test.ts)

## 3. Evidence

- [x] 3.1 Capture the output screenshot as evidence (source re-screenshot is handled in design-apply Step 2)
- [x] 3.2 Emit the final delta/score report alongside the screenshot (report.json + stdout)
- [x] 3.3 Evidence persistence via `--out` dir; documented in the CLI usage
- [x] 3.4 Verified end-to-end: self-verify → score 100 + evidence image; cross-reference → fail + 4 fix instructions

## 4. Graceful degradation

- [x] 4.1 On no-browser, run the token-only check and skip rendering (verify.mjs `visualVerification:false`)
- [x] 4.2 Explicitly state visual verification was skipped (stderr warning + flag in output)
- [x] 4.3 Tests: token-only flag path + decision logic (verify-core + verify visualVerification flag)

## 5. Integrate into design-apply

- [x] 5.1 Replace `design-apply` Step 5 checklist self-check with the quantified loop
- [x] 5.2 Wire tier-based behavior (full → loop with evidence; token-only → degraded check with notice)
- [x] 5.3 Expose threshold and iteration cap with conservative defaults (--threshold; DEFAULT_LOOP cap/epsilon)

## 6. Verification

- [x] 6.1 Loop detects an off-palette/mismatched output and emits concrete fix instructions (verified: 4 deltas with reference values)
- [x] 6.2 Bounded cost: cap + convergence both terminate the loop (decideOutcome tested)
- [x] 6.3 Full-tier produces evidence; token-only tier degrades with a clear notice (both verified)
