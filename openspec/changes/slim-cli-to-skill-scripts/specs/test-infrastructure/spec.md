## REMOVED Requirements

### Requirement: CLI integration test build
**Reason**: The TypeScript CLI and its `tsdown` build were removed; bundled `.mjs` scripts run directly with no build step, so there is nothing to build before tests.
**Migration**: `vitest` runs the scripts directly; the `globalSetup` that ran `tsdown` was removed.

## MODIFIED Requirements

### Requirement: Vitest configuration
The project SHALL use vitest to run tests under `tests/**/*.test.ts`, with no build/globalSetup step (the bundled scripts require no compilation).

#### Scenario: Tests run without a build
- **WHEN** `npm test` is invoked
- **THEN** vitest runs the unit and integration suites directly against the `.mjs` scripts, with no prior `tsdown` build
