## ADDED Requirements

### Requirement: Essence layer

The design document SHALL include an "essence" section capturing the 3–5 traits that most define the look, so generation has an explicit priority signal above the full token detail.

#### Scenario: Essence present and bounded
- **WHEN** a design document is produced
- **THEN** it contains an essence section with at most five defining traits derived from the design system

### Requirement: Comprehensive template

The design document template SHALL cover, in addition to base tokens: component states (rest, hover, active, focus, disabled, loading), responsive breakpoints, motion tokens, light and dark variants, voice/tone, and explicit anti-patterns.

#### Scenario: Component states documented
- **WHEN** the document describes an interactive component
- **THEN** it specifies its rest, hover, active, focus, disabled, and loading states (or marks ones that do not apply)

#### Scenario: Light and dark variants
- **WHEN** the source provides both light and dark schemes
- **THEN** the document records both variants rather than a single assumed mode

#### Scenario: Anti-patterns captured
- **WHEN** the document is produced
- **THEN** it lists explicit anti-patterns ("what this design would never do") to constrain generation

### Requirement: Rendered from structured data

The design document SHALL be rendered from the structured token set and SHALL stay consistent with it (regenerating the document reflects changes to the structured set).

#### Scenario: Regeneration reflects structured changes
- **WHEN** the structured token set changes and the document is re-rendered
- **THEN** the document reflects the updated values
