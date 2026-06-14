## Why

This is a **skill**; the CLI was only meant to assist distillation. It has scope-crept into a ~1600-line globally-published npm package whose bulk (`store`/`list`/`show`/`path`/`remove`) merely re-implements file operations the agent does natively, gated behind an `npx design-distill init` step that is the user's first point of friction — and the distill flow barely uses it (only `path` and `show`, both trivial checks). Skill best practice favors lean SKILL.md files with progressive disclosure and **bundled scripts invoked via Bash**, not a separate global CLI. Separately, our skills use bare frontmatter while upstream `dembrandt-skills` shows rich discovery metadata that makes skills trigger reliably. This change removes the over-engineering and adopts the discovery conventions.

## What Changes

- **BREAKING (distribution):** Stop publishing a global `design-distill` CLI. Remove the global `bin` and the `npx design-distill init` install step.
- **Remove file-management commands** (`list`/`show`/`path`/`remove`) and the `store` wrapper as a CLI surface; the skills read/write `~/.config/design-distill/` (honoring `DESIGN_DISTILL_HOME`) with agent-native file operations, per a documented directory convention.
- **Keep genuinely algorithmic tooling as skill-bundled scripts** invoked via Bash: `diff`, `preview`, plus the foundation's `extract`/`screenshot`/`compare`/bootstrap. No global install.
- **Shrink `init` to bootstrap**: ensure Chromium + seed the bundled styles into the library (no global CLI install).
- **Adopt rich skill frontmatter** (borrowed from upstream): `promptSignals.phrases`, `retrieval.aliases/intents/examples`, and `metadata` (including a dembrandt version constraint) on `design-distill` and `design-apply` for reliable triggering and discovery.
- **Apply progressive disclosure**: move long procedural detail and design principles (e.g., normalization rules, contrast rules) into `references/` loaded on demand, keeping SKILL.md lean.

## Capabilities

### New Capabilities
- `skill-bundled-tooling`: Deterministic helpers ship as skill-bundled scripts invoked via Bash (no globally-published CLI); file/library management uses agent-native operations against a documented directory convention.
- `skill-discovery`: Skills carry rich discovery frontmatter (prompt signals, retrieval aliases/intents/examples, metadata/version constraints) and use `references/` progressive disclosure to keep SKILL.md lean.

### Modified Capabilities
- `cli`: The `DESIGN_DISTILL_HOME` override moves from the removed `store.ts` to `scripts/lib/config.mjs#libraryHome` (behavior preserved).
- `unit-tests`: Parser / parseDesignHeader / legacy generateHtml tests removed with their code; color coverage moves to the scripts suites; preview coverage moves to `scripts/preview.mjs` tests.
- `test-infrastructure`: The CLI/tsdown build + vitest `globalSetup` are removed; tests run directly against the zero-build scripts.

## Impact

- **Depends on:** `extract-screenshot-compare-primitives` (bootstrap + primitives already live as scripts) and `structured-design-store` (structured reads replace `store`/`parsers` access).
- **Code:** remove `src/commands/{list,show,path,remove,init}.ts` global-CLI surface and `src/cli.ts` `bin`; retain `diff`/`preview`/`color` logic as bundled scripts; drop the published-package wiring (tsdown `bin`, `prepublishOnly`) as appropriate.
- **`package.json`:** remove the `bin`; reframe the package as skill assets rather than a global tool.
- **Skills:** `design-distill` / `design-apply` SKILL.md gain rich frontmatter and `references/`; instructions point at bundled scripts and the directory convention instead of CLI commands.
- **Docs:** README/install instructions drop `npx design-distill init`; replace with `npx skills add …` + one-time bootstrap.
- **Compatibility:** `DESIGN_DISTILL_HOME` override behavior is preserved via the documented directory convention.
