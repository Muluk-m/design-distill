## Context

Design Distill is a skill; the CLI was meant only to assist distillation but grew into a ~1600-line globally-published package. Most of it (`store`/`list`/`show`/`path`/`remove`) re-implements file operations the agent does natively, behind an `npx design-distill init` step that is the first friction point — and the distill flow only ever calls `path`/`show`. Meanwhile our skills use bare frontmatter, while upstream `dembrandt-skills` demonstrates rich discovery metadata. By this point the foundation and structured-store changes have already moved the real logic (`extract`/`screenshot`/`compare`/bootstrap, structured reads) out of the CLI, so this change is the cleanup: remove the redundant CLI surface and adopt skill conventions.

## Goals / Non-Goals

**Goals:**
- Eliminate the globally-published CLI and the `init` install step.
- Replace file-management commands with agent-native operations against a documented directory convention (preserving `DESIGN_DISTILL_HOME`).
- Keep only genuinely algorithmic helpers (`diff`, `preview`) as bundled scripts.
- Shrink `init` to a bootstrap (ensure Chromium + seed bundled styles).
- Adopt rich discovery frontmatter and `references/` progressive disclosure.

**Non-Goals:**
- Building the primitives or bootstrap (foundation change).
- Changing the storage model (`structured-design-store`).
- Adding extraction breadth or the visual loop (their own changes).

## Decisions

### D1: Sequence this last
Run this cleanup after the foundation and structured-store changes have relocated the real logic into bundled scripts and structured reads. **Why:** removing `store`/`parsers` access is safe only once consumers read structured data and use the primitives; doing it first would break them. **Alternative:** slim first — rejected (ordering hazard).

### D2: Agent-native file ops over a documented convention, not commands
`list`/`show`/`path`/`remove` become direct directory operations the skill performs, governed by a documented layout. **Why:** these are trivial fs actions the agent already does; a CLI for them is pure overhead and an install step. Preserve `DESIGN_DISTILL_HOME` so existing behavior/tests hold. **Alternative:** keep them as bundled scripts — rejected; still ceremony around `ls`/`cat`/`rm`.

### D3: Keep `diff`/`preview` as scripts, not commands
They carry real logic (color deltaE, HTML generation) and stay as bundled scripts invoked via Bash. **Why:** algorithmic work belongs in code; it just shouldn't require a global install. `diff` reuses `compare`; `preview` renders from the structured set.

### D4: Bootstrap, not init
Replace `init`'s global-install behavior with the foundation's bootstrap (ensure Chromium) plus seeding bundled styles. **Why:** the only legitimate setup work is the browser dependency and seeding the library; installing a binary is not needed.

### D5: Adopt upstream discovery conventions verbatim where sensible
Use `promptSignals`, `retrieval`, and `metadata` (incl. dembrandt version constraint) on both skills, and push depth into `references/`. **Why:** proven to improve triggering/discovery; keeps SKILL.md lean per best practice. **Alternative:** invent our own metadata shape — rejected; aligning with the ecosystem aids interop and familiarity.

## Risks / Trade-offs

- **Removing the global CLI breaks anyone who scripted against it** → it is pre-release skill tooling; document the change in README and provide the equivalent skill/bootstrap path. The package stops exposing a `bin`.
- **Agent-native ops lose the `validateName` path-traversal guard** → keep name validation in the directory convention/helpers the skills use, so safety isn't lost with the command.
- **Test suite assumes CLI commands** → migrate tests: keep unit tests for retained logic (`color`, `diff`, `preview`, structured reads); drop/replace command-surface tests.
- **References can fragment instructions** → keep a clear index in SKILL.md pointing to each reference so disclosure stays navigable.

## Migration Plan

1. Confirm consumers read structured data and use primitives (depends on prior changes) — no remaining `store`/`parsers` dependency.
2. Convert `diff`/`preview` to bundled scripts (Bash-invoked); `diff` delegates to `compare`.
3. Replace `init` with bootstrap (ensure Chromium + seed bundled styles).
4. Remove `list`/`show`/`path`/`remove`/`store` CLI surface and `bin`; encode the directory convention + name validation into skill helpers.
5. Add rich frontmatter to both skills; extract long detail into `references/` with an index.
6. Update README/docs to drop `npx design-distill init`.
7. Update tests accordingly.

Rollback: re-expose the `bin` and commands from version control if needed; changes are localized to the CLI surface and skill frontmatter.

## Open Questions

- Keep the `src/` package for the bundled scripts (built) or move scripts to plain `.mjs` under the skills for zero-build portability (ties to the foundation's runtime decision)?
- Whether to retain a tiny optional CLI for power users (e.g., `diff`) or skills-only.
- Exact `references/` split (one per concern vs. a few grouped files).
