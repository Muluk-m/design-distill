## ADDED Requirements

### Requirement: Map raw tokens to semantic roles

The normalization layer SHALL map raw extracted tokens to a fixed set of semantic roles — at minimum `color-primary`, `color-secondary`, `color-surface`, `color-surface-raised`, `color-border`, `color-text`, `color-text-secondary`, `color-error`, `color-warning`, `color-success`, a spacing base unit, `radius-button`, `radius-card`, and a modular type scale — rather than passing raw values through unlabeled.

#### Scenario: Roles assigned
- **WHEN** a raw token set is normalized
- **THEN** each defined semantic role is populated (or explicitly marked absent), not left as an unlabeled value list

### Requirement: Explicit decision rules

Normalization SHALL apply documented, deterministic decision rules so the same input yields the same semantic system.

#### Scenario: Competing brand colors
- **WHEN** more than two brand colors compete for `color-primary`
- **THEN** the role is assigned to the color with the highest usage on interactive elements

#### Scenario: Minimum body text size
- **WHEN** the extracted body text size is below 16px
- **THEN** `text-base` is set to 16px and the override is recorded

#### Scenario: Type scale coherence
- **WHEN** extracted type sizes do not follow a consistent ratio
- **THEN** sizes are rounded to the nearest step of a coherent modular scale

#### Scenario: Reserved status hues
- **WHEN** assigning `color-error` and `color-warning`
- **THEN** error is reserved to a red hue and warning to a distinct amber, and a brand color that is itself orange does not double as the warning role

### Requirement: Confidence-weighted assignment

Normalization SHALL use the confidence scores carried by the extract primitive, preferring high-confidence tokens when assigning brand roles.

#### Scenario: High-confidence preferred
- **WHEN** both a high-confidence and a low-confidence candidate exist for a brand role
- **THEN** the high-confidence candidate is chosen
