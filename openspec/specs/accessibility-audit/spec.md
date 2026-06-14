# accessibility-audit Specification

## Purpose
TBD - created by archiving change comprehensive-extraction. Update Purpose after archive.
## Requirements
### Requirement: Contrast audit over the semantic palette

Distillation SHALL run a WCAG contrast audit over the semantic palette and record, per relevant text-on-surface pair, the contrast ratio and a pass/fail against WCAG 2.2 AA thresholds.

#### Scenario: Pairs audited
- **WHEN** the semantic palette is established
- **THEN** distillation evaluates at minimum `color-text` on `color-surface`, `color-text-secondary` on `color-surface`, and `color-primary` label contrast, recording each ratio and pass/fail

#### Scenario: Results stored in the design system
- **WHEN** the audit completes
- **THEN** the pass/fail results and ratios are recorded in the structured set, not discarded

### Requirement: Surface failures without mutating the source design

The audit SHALL surface contrast failures as findings, and SHALL NOT silently alter the distilled source palette to "fix" them (distillation records what the source is; remediation belongs to generation).

#### Scenario: Failing pair reported
- **WHEN** a text-on-surface pair fails AA
- **THEN** the failure is reported as a finding against the distilled system

#### Scenario: Source palette preserved
- **WHEN** a contrast failure is found during distillation
- **THEN** the recorded source token values are left unchanged, and the failure is noted rather than auto-corrected

