# unit-tests Specification

## Purpose
Unit-test coverage for the design-distill skill's bundled `.mjs` primitives. (The legacy TypeScript CLI and its tests were removed in slim-cli-to-skill-scripts; coverage moved to the scripts test suite.)

## Requirements

### Requirement: Color utility unit tests
The color utilities SHALL have unit tests. They live in `scripts/lib/color.mjs` (the legacy `src/lib/color.ts` was removed) and cover hex + rgb()/rgba() parsing, alpha, luminance, perceptual distance, and hue classification.

#### Scenario: Parses hex and rgb() equivalently
- **WHEN** comparing `#5e6ad2` and `rgb(94,106,210)`
- **THEN** deltaE returns 0

#### Scenario: Detects near-transparent colors
- **WHEN** a color is `rgba(255,255,255,0)`
- **THEN** isOpaque returns false

#### Scenario: Classifies status hues
- **WHEN** the color is `#eb5757`
- **THEN** hueFamily returns "red"

### Requirement: Primitive logic unit tests
The deterministic primitives SHALL have unit tests: token extraction/mapping, comparison, semantic normalization, essence, rendering, WCAG audit, merge, capability probe, bootstrap, target resolution, the verification-loop decision logic, and dev-server detection.

#### Scenario: Suite runs against the bundled scripts
- **WHEN** `npm test` runs
- **THEN** vitest executes the unit suites under `tests/unit/` against `scripts/**/*.mjs`
