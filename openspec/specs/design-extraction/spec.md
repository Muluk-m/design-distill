# design-extraction Specification

## Purpose
TBD - created by archiving change extract-screenshot-compare-primitives. Update Purpose after archive.
## Requirements
### Requirement: Extract tokens from any target

The extract primitive SHALL accept a target that is either a live `http(s)://` URL or a local `file://` path and SHALL produce a structured design-token set covering at minimum colors, typography, spacing, border-radius, shadows, and component styles.

#### Scenario: Extract from a live URL
- **WHEN** the primitive is invoked with `https://linear.app`
- **THEN** it returns a structured token set containing color, typography, spacing, radius, shadow, and component fields

#### Scenario: Extract from a local generated artifact
- **WHEN** the primitive is invoked with a `file://` path to a locally generated HTML file
- **THEN** it returns a token set in the same structure as for a live URL, enabling generated output to be compared against a saved design system

### Requirement: Pinned dembrandt with native fallback

The extract primitive SHALL invoke dembrandt at a pinned version as its preferred token source, and SHALL fall back to a native `getComputedStyle`-based extraction when dembrandt is unavailable, errors, or returns an empty result.

#### Scenario: dembrandt available
- **WHEN** the pinned dembrandt runs successfully against the target
- **THEN** the primitive returns dembrandt's frequency-ranked tokens (including statistical signals such as base-unit inference)

#### Scenario: dembrandt unavailable or fails
- **WHEN** dembrandt is not installed, exits non-zero, or returns no usable tokens
- **THEN** the primitive falls back to native `getComputedStyle` extraction and returns whatever tokens it can derive, without raising an unhandled error

#### Scenario: dembrandt version is pinned
- **WHEN** the primitive invokes dembrandt
- **THEN** it requests a specific pinned version rather than floating to the latest published release

### Requirement: Structured, machine-readable output

The extract primitive SHALL emit its result as a single structured (JSON) object on a predictable channel so that downstream primitives (compare) and skills can consume it without re-parsing prose.

#### Scenario: JSON result is consumable
- **WHEN** the primitive completes extraction
- **THEN** its output is valid JSON with a stable top-level shape that the compare primitive can ingest directly

### Requirement: Confidence-scored tokens

When the underlying source provides confidence scoring (as dembrandt does for colors), the extract primitive SHALL preserve a per-token confidence signal (e.g., high/medium/low) in its output so that downstream consumers can prioritize high-confidence brand tokens over incidental ones.

#### Scenario: Confidence preserved from dembrandt
- **WHEN** dembrandt returns colors with high/medium/low confidence
- **THEN** the primitive's output retains the confidence level for each color

#### Scenario: Fallback without confidence
- **WHEN** confidence scoring is unavailable (native fallback path)
- **THEN** the output omits or marks confidence as unknown rather than fabricating a level

### Requirement: MCP source uses the async job protocol

When the extract primitive sources tokens via the dembrandt MCP server, it SHALL follow that server's asynchronous job contract — submit the extraction, poll job status until completion, then read the result — rather than assuming a synchronous response.

#### Scenario: Async MCP extraction
- **WHEN** extraction is dispatched through the MCP server and returns a job handle
- **THEN** the primitive polls job status until completion and returns the finished result, without treating the initial job handle as the token set

#### Scenario: MCP unavailable
- **WHEN** the MCP server is not configured
- **THEN** the primitive falls back to the pinned CLI path (and then to native extraction) per the source-precedence rules

