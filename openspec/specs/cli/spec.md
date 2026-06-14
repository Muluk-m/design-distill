# cli Specification

## Purpose
Library location/config conventions for the design-distill skill. (The global TypeScript CLI was removed in slim-cli-to-skill-scripts; the skill now uses zero-build bundled scripts. This capability retains the library-location contract those scripts honor.)

## Requirements

### Requirement: Library home supports environment variable override
The library home resolution SHALL use `process.env.DESIGN_DISTILL_HOME` when set, falling back to `~/.config/design-distill/` when not set. This behavior lives in `scripts/lib/config.mjs#libraryHome` (the legacy `store.ts` was removed with the rest of the TypeScript CLI).

#### Scenario: Environment variable set
- **WHEN** `DESIGN_DISTILL_HOME=/tmp/test-lib` is set
- **THEN** library reads/writes operate on `/tmp/test-lib/` instead of `~/.config/design-distill/`

#### Scenario: Environment variable not set
- **WHEN** `DESIGN_DISTILL_HOME` is not set
- **THEN** library reads/writes operate on `~/.config/design-distill/` as before
