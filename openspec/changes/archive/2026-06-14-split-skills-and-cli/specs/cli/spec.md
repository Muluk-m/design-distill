## ADDED Requirements

### Requirement: CLI init command
The system SHALL provide a `design-distill init` command that installs dembrandt and Playwright chromium browser.

#### Scenario: First-time setup
- **WHEN** user runs `npx design-distill init`
- **THEN** system installs dembrandt globally (`npm install -g dembrandt`) and Playwright chromium (`npx playwright install chromium`), reporting success/failure for each

#### Scenario: Already installed
- **WHEN** user runs `npx design-distill init` and dependencies are already present
- **THEN** system reports "Already installed" for each dependency without re-installing

### Requirement: CLI list command
The system SHALL provide a `design-distill list` command that lists all saved design systems from the global library.

#### Scenario: Library has styles
- **WHEN** user runs `npx design-distill list` and `~/.config/design-distill/` contains subdirectories with DESIGN.md files
- **THEN** system outputs a table with columns: name, source_url, distilled date

#### Scenario: Empty library
- **WHEN** user runs `npx design-distill list` and no styles exist
- **THEN** system outputs "No styles saved yet."

#### Scenario: JSON output
- **WHEN** user runs `npx design-distill list --json`
- **THEN** system outputs a JSON array of `{ name, source_url, distilled }` objects

### Requirement: CLI show command
The system SHALL provide a `design-distill show <name>` command that displays the content of a saved design system.

#### Scenario: Style exists
- **WHEN** user runs `npx design-distill show linear`
- **THEN** system outputs the full content of `~/.config/design-distill/linear/DESIGN.md`

#### Scenario: Style not found
- **WHEN** user runs `npx design-distill show nonexistent`
- **THEN** system exits with error "Style 'nonexistent' not found."

### Requirement: CLI remove command
The system SHALL provide a `design-distill remove <name>` command that deletes a saved design system.

#### Scenario: Confirm and remove
- **WHEN** user runs `npx design-distill remove linear` and confirms
- **THEN** system deletes `~/.config/design-distill/linear/` directory

#### Scenario: Style not found
- **WHEN** user runs `npx design-distill remove nonexistent`
- **THEN** system exits with error "Style 'nonexistent' not found."

### Requirement: CLI path command
The system SHALL provide a `design-distill path <name>` command that outputs the filesystem path to a design system's DESIGN.md.

#### Scenario: Style exists
- **WHEN** user runs `npx design-distill path linear`
- **THEN** system outputs the absolute path (e.g., `/Users/x/.config/design-distill/linear/DESIGN.md`)

#### Scenario: Style not found
- **WHEN** user runs `npx design-distill path nonexistent`
- **THEN** system exits with error code 1

### Requirement: CLI diff command
The system SHALL provide a `design-distill diff <name>` command that re-extracts tokens from the source site and diffs against the saved DESIGN.md.

#### Scenario: Diff detects changes
- **WHEN** user runs `npx design-distill diff linear` and `linear` has a `source_url`
- **THEN** system re-extracts tokens via dembrandt, compares against saved DESIGN.md, and outputs a markdown table with columns: Category, Token, Old Value, New Value

#### Scenario: No source_url
- **WHEN** user runs `npx design-distill diff my-app` and the style was extracted from a local project (no `source_url`)
- **THEN** system exits with error "Style 'my-app' has no source_url. Diff requires a remote source."

#### Scenario: Playwright not installed
- **WHEN** user runs `npx design-distill diff linear` and Playwright chromium is not available
- **THEN** system exits with error "Playwright is required for diff. Run `npx design-distill init` first."

#### Scenario: Noise filtering
- **WHEN** diff detects token changes
- **THEN** system filters out noise: color changes with deltaE < 5 are ignored, spacing changes < 2px are ignored. Only meaningful changes are reported.

#### Scenario: Style not found
- **WHEN** user runs `npx design-distill diff nonexistent`
- **THEN** system exits with error "Style 'nonexistent' not found."

### Requirement: CLI preview command
The system SHALL provide a `design-distill preview <name>` command that generates a visual HTML preview of a design system.

#### Scenario: Preview a style
- **WHEN** user runs `npx design-distill preview linear`
- **THEN** system generates a standalone HTML file containing: color swatches with hex labels, typography samples with font names and sizes, spacing scale visualization, and component shape examples. File is written to a temp path and opened in the default browser.

#### Scenario: Cross-platform open
- **WHEN** the preview HTML is ready
- **THEN** system uses `open` on macOS, `xdg-open` on Linux, and `start` on Windows to open the file

#### Scenario: Style not found
- **WHEN** user runs `npx design-distill preview nonexistent`
- **THEN** system exits with error "Style 'nonexistent' not found."

### Requirement: Bundled styles on init
The system SHALL copy pre-bundled design system snapshots to the global library during `init`.

#### Scenario: First-time init with bundled styles
- **WHEN** user runs `npx design-distill init` and no styles exist in the library
- **THEN** system copies 5 bundled DESIGN.md files (linear, vercel, stripe, notion, github) from the npm package's `bundled/` directory to `~/.config/design-distill/<name>/DESIGN.md`

#### Scenario: Init does not overwrite existing styles
- **WHEN** user runs `npx design-distill init` and `linear` already exists in the library
- **THEN** system skips `linear` and reports "Skipped: linear (already exists). Use --force to overwrite."

#### Scenario: Force overwrite
- **WHEN** user runs `npx design-distill init --force`
- **THEN** system copies all bundled styles, overwriting any existing ones with the same name
