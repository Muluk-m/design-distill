## ADDED Requirements

### Requirement: Per-category structured comparison

The compare primitive SHALL accept two token sets and produce a structured delta report organized by category (colors, typography, spacing, border-radius, shadows, components), where each reported difference identifies the token, the reference value, and the candidate value.

#### Scenario: Differences across multiple categories
- **WHEN** two token sets differ in colors, font family, and spacing
- **THEN** the report groups the differences under their respective categories with reference and candidate values for each

#### Scenario: Identical token sets
- **WHEN** two token sets are equivalent within thresholds
- **THEN** the report contains no differences and indicates a match

### Requirement: Per-category thresholds

The compare primitive SHALL apply category-appropriate tolerance so that perceptually or semantically insignificant differences are not reported, using perceptual color distance for colors and suitable numeric/string tolerances for other categories.

#### Scenario: Color difference below perceptual threshold
- **WHEN** two colors differ by less than the configured perceptual distance
- **THEN** the difference is not reported

#### Scenario: Color difference above perceptual threshold
- **WHEN** two colors differ by more than the configured perceptual distance
- **THEN** the difference is reported

### Requirement: Shared engine for drift and output verification

The compare primitive SHALL be usable both for source-drift detection (saved design system vs. current live extraction) and for generated-output verification (extracted output tokens vs. saved design system), with the same input contract and output shape.

#### Scenario: Drift detection
- **WHEN** the saved design system is compared against a fresh extraction of its source site
- **THEN** the report describes how the live site has drifted from the saved system

#### Scenario: Output verification
- **WHEN** tokens extracted from generated output are compared against the saved design system
- **THEN** the report describes where the generated output deviates from the system, and is suitable for driving an iterate-until-converged loop

### Requirement: Quantified fidelity signal

The compare primitive SHALL emit an overall, quantified fidelity signal (e.g., a score or pass/fail against a threshold) in addition to the itemized deltas, so callers can make automated decisions without interpreting prose.

#### Scenario: Score available to callers
- **WHEN** the comparison completes
- **THEN** the result includes a machine-readable overall fidelity measure alongside the per-category deltas
