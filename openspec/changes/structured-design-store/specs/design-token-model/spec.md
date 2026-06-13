## ADDED Requirements

### Requirement: Structured token set is the source of truth

A saved design system SHALL persist a canonical, structured token set (JSON, aligned with the W3C DTCG shape) as its source of truth, and `DESIGN.md` SHALL be a rendered view derived from it.

#### Scenario: Save produces structured artifact
- **WHEN** a design system is saved
- **THEN** a structured token file is written alongside `DESIGN.md` under the style directory

#### Scenario: DESIGN.md is derivable
- **WHEN** the structured token set exists
- **THEN** `DESIGN.md` can be (re)rendered from it without information that exists only in the prose

### Requirement: No prose re-parsing

Consumers (compare, diff, preview, apply) SHALL read tokens from the structured set, and SHALL NOT recover token values by regex-parsing `DESIGN.md`.

#### Scenario: Tooling reads structured data
- **WHEN** diff or preview needs token values
- **THEN** it reads them from the structured token set, not by parsing `DESIGN.md`

#### Scenario: Regex parser removed
- **WHEN** the change is complete
- **THEN** the prose token re-parser (`parsers.ts`) is no longer used by any consumer

### Requirement: Bundled and saved styles use the structured layout

The 5 bundled styles and the saved-library format SHALL be migrated to the structured-first layout so existing styles remain usable.

#### Scenario: Bundled style loads structured
- **WHEN** a bundled style (e.g., `linear`) is loaded after migration
- **THEN** its structured token set is present and consumable, and its `DESIGN.md` renders from it
