## REMOVED Requirements

### Requirement: Parser unit tests
**Reason**: `src/lib/parsers.ts` was deleted — the structured `tokens.json` is canonical and is no longer recovered by regex-parsing prose, so there are no parser functions to test.
**Migration**: Token-shape coverage now lives in the scripts test suite (`tests/unit/{extract-core,compare,semantic}.test.ts`).

### Requirement: parseDesignHeader unit tests
**Reason**: `parseDesignHeader` (in the removed `src/lib/store.ts`) no longer exists; header metadata now comes from the structured set's `source`/`meta`.
**Migration**: No replacement needed — metadata is read directly from `tokens.json`.

### Requirement: generateHtml unit tests
**Reason**: The legacy `src/commands/preview.ts#generateHtml` was removed.
**Migration**: Preview now renders from `tokens.json` via `scripts/preview.mjs#generateHtml`, covered by `tests/unit/preview.test.ts`.

## MODIFIED Requirements

### Requirement: Color utility unit tests
Color utilities SHALL have unit tests. The utilities now live in `scripts/lib/color.mjs` (the legacy `src/lib/color.ts` was removed) and are exercised by the compare, wcag, and semantic test suites.

#### Scenario: Color helpers are tested
- **WHEN** the test suite runs
- **THEN** color behavior (deltaE, hue family, contrast) is covered via `tests/unit/{compare,wcag,semantic}.test.ts`
