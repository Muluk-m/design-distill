# test-infrastructure Specification

## Purpose
Test runner + fixtures for the design-distill skill. Tests run directly against the zero-build bundled scripts (no compilation step).

## Requirements

### Requirement: Vitest configuration
The project SHALL use vitest to run all `tests/**/*.test.ts` files, with no build/globalSetup step (the bundled `.mjs` scripts require no compilation).

#### Scenario: Run all tests without a build
- **WHEN** the developer runs `npm test`
- **THEN** vitest discovers and executes all test files under `tests/` directly against the `.mjs` scripts, with no prior `tsdown` build

### Requirement: Test fixtures
The project SHALL include test fixtures in `tests/fixtures/` (e.g. a sample HTML page) used by the browser-integration tests.

#### Scenario: Fixtures available
- **WHEN** a test references a fixture file
- **THEN** the fixture exists with known values for assertion
