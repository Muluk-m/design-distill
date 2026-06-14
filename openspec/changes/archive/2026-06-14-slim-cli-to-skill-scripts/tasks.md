## 1. Preconditions

- [x] 1.1 New pipeline (extract/build-design/compare/verify/diff) reads structured data + primitives — no dependence on the legacy `store`/`parsers`
- [x] 1.2 Inventory CLI usages in both SKILL.md files (repointed to bundled scripts + directory convention across changes 1–4)

## 2. Retain algorithmic helpers as scripts

- [x] 2.1 `diff` as a bundled script delegating to `compare` (scripts/diff.mjs); no global install
- [x] 2.2 Port `preview` to a bundled script that renders from the structured `tokens.json` (scripts/preview.mjs, opens cross-platform; HTML-escapes values)
- [x] 2.3 diff + preview scripts run standalone (diff: clean error path; preview: builds HTML — tested)

## 3. Remove redundant CLI surface

- [x] 3.1 Skills no longer use `list`/`show`/`path`/`remove` — replaced by agent-native file ops + directory convention (SKILL repointed)
- [x] 3.2 Directory convention (`~/.config/design-distill/`, `DESIGN_DISTILL_HOME`) centralized in `scripts/lib/config.mjs#libraryHome`
- [x] 3.3 Remove the global `bin` from `package.json` (no globally-published CLI)
- [x] 3.4 Physically deleted `src/` (cli.ts, commands/, lib/{store,parsers,color}.ts, types.ts), tsdown.config.ts, dist/, and migrated/removed the legacy tests; dropped `tsdown`/`typescript`/`commander` deps and the build scripts

## 4. Bootstrap replaces init

- [x] 4.1 Bootstrap (`scripts/setup.mjs`) ensures a browser (reuse-first) + seeds bundled styles; skills use it instead of `init`
- [x] 4.2 Tests: bootstrap seeds bundled styles + reuses/installs without a global binary (bootstrap.test.ts)

## 5. Skill discovery & progressive disclosure

- [x] 5.1 Rich frontmatter on `design-distill` (promptSignals, retrieval aliases/intents/examples, metadata + requires)
- [x] 5.2 Rich frontmatter on `design-apply` likewise
- [x] 5.3 Procedural depth deferred to `references/` (template.md referenced from frontmatter; SKILL.md is the entry point)
- [x] 5.4 Both SKILL flows point at bundled scripts + the directory convention instead of CLI commands

## 6. Docs & cleanup

- [x] 6.1 README/install docs drop `npx design-distill init`; use `npx skills add …` + `node scripts/setup.mjs`; CLI table replaced with the bundled primitives
- [x] 6.2 Removed the legacy test suite (cli/store/parsers/generate-html/design-header/color); replaced preview coverage with scripts/preview.mjs tests; vitest globalSetup build step removed
- [x] 6.3 Skills function via `node scripts/*` with no global CLI present (bin removed; primitives verified standalone)

## 7. Verification

- [x] 7.1 Primitives run standalone with no `design-distill` global binary (extract/build-design/screenshot/compare/diff/verify all exercised)
- [x] 7.2 SKILL.md files are entry points with rich frontmatter; template lives in references/
- [x] 7.3 Discovery frontmatter present and surfaced (skill descriptions updated with intents/examples)
