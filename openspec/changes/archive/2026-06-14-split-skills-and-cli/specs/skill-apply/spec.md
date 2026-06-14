## ADDED Requirements

### Requirement: Skill frontmatter with argument-hint
The `design:apply` skill MUST include `argument-hint` in its YAML frontmatter to guide user input.

#### Scenario: Skill metadata
- **WHEN** the skill is loaded by Claude Code
- **THEN** frontmatter contains `argument-hint: "用 <风格名> 做一个 <页面描述>"`

### Requirement: Load style by name from global library
The skill SHALL load a design system by name from the global library when the user specifies a style name.

#### Scenario: Explicit style name
- **WHEN** user invokes `design:apply 用 linear 做个博客主页`
- **THEN** skill reads `~/.config/design-distill/linear/DESIGN.md`, re-screenshots the source_url, and generates code constrained to that design system

#### Scenario: Style not found
- **WHEN** user specifies a style name that doesn't exist in the global library
- **THEN** skill reports the error and lists available styles

### Requirement: Fall back to local DESIGN.md
The skill SHALL use the project's own `./DESIGN.md` when no style name is specified but the file exists.

#### Scenario: Local DESIGN.md present, no style name
- **WHEN** user invokes `design:apply 做个登录页` and `./DESIGN.md` exists in the project
- **THEN** skill loads `./DESIGN.md` as the active design system

### Requirement: No style available behavior
The skill SHALL list available styles when no style name is given and no local DESIGN.md exists.

#### Scenario: No style and no local file
- **WHEN** user invokes `design:apply 做个登录页` with no style name and no `./DESIGN.md`
- **THEN** skill lists available styles from global library and asks user to choose one

### Requirement: Re-screenshot source for visual calibration
The skill SHALL re-screenshot the source_url from the loaded DESIGN.md before generating code.

#### Scenario: Source URL present
- **WHEN** DESIGN.md contains a `source_url` field
- **THEN** skill visits the URL via `/browse`, takes screenshots, and uses them for visual calibration during generation

#### Scenario: No source URL
- **WHEN** DESIGN.md has no `source_url` (e.g., extracted from local project)
- **THEN** skill generates based on document values only, without screenshots

#### Scenario: Source URL fails with archived screenshots
- **WHEN** DESIGN.md contains a `source_url` AND re-screenshot fails (404, timeout, site unreachable) AND archived screenshots exist at `~/.config/design-distill/<name>/screenshots/`
- **THEN** skill loads archived screenshots for visual calibration and warns "Using archived screenshots (source site unavailable)"

#### Scenario: Source URL fails without archived screenshots
- **WHEN** DESIGN.md contains a `source_url` AND re-screenshot fails AND no archived screenshots exist
- **THEN** skill generates based on document values only and warns "Source site unavailable, no archived screenshots. Generating from document values only."

### Requirement: Style-constrained generation
The skill SHALL generate code strictly constrained to the loaded design system.

#### Scenario: Color constraint
- **WHEN** generating code
- **THEN** all colors used MUST come from the DESIGN.md palette; no new colors are introduced

#### Scenario: Post-generation self-check
- **WHEN** code generation is complete
- **THEN** skill verifies: background tonality matches, fonts are correct, CTA style matches, no off-palette colors, overall feel matches screenshot
