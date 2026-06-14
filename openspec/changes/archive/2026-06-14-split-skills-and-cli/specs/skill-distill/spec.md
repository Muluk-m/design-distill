## ADDED Requirements

### Requirement: Skill frontmatter with argument-hint
The `design:distill` skill MUST include `argument-hint` in its YAML frontmatter to guide user input.

#### Scenario: Skill metadata
- **WHEN** the skill is loaded by Claude Code
- **THEN** frontmatter contains `argument-hint: "<URL 或本地项目路径>"`

### Requirement: Distill from URL
The skill SHALL extract a design system from a website URL using dembrandt + screenshots, then save to the global library only.

#### Scenario: Distill a website
- **WHEN** user invokes `design:distill https://linear.app`
- **THEN** skill runs dembrandt extraction and takes screenshots via `/browse`, combines both sources into a DESIGN.md, derives style name from domain (`linear`), and saves to `~/.config/design-distill/linear/DESIGN.md`

#### Scenario: Name collision
- **WHEN** style name already exists in global library
- **THEN** skill asks user whether to overwrite or choose a different name

#### Scenario: dembrandt not available
- **WHEN** dembrandt or Playwright is not installed
- **THEN** skill suggests running `npx design-distill init`, then falls back to browser-only extraction

### Requirement: Distill from local project
The skill SHALL extract a design system from a local project path by reading tailwind config, CSS custom properties, and design token files.

#### Scenario: Local project with tailwind
- **WHEN** user invokes `design:distill ./my-app`
- **THEN** skill reads tailwind.config, CSS variables, and component samples, generates DESIGN.md, and saves to global library using directory name as style name

### Requirement: No-argument behavior is list
The skill SHALL list all saved design systems when invoked without arguments.

#### Scenario: No arguments provided
- **WHEN** user invokes `design:distill` with no arguments
- **THEN** skill runs `npx design-distill list` and displays the result

### Requirement: Save to global library only
The skill SHALL NOT write DESIGN.md to the current project root directory. All distill output goes to `~/.config/design-distill/<name>/DESIGN.md`.

#### Scenario: Distill output location
- **WHEN** distill completes successfully
- **THEN** DESIGN.md exists at `~/.config/design-distill/<name>/DESIGN.md` and no DESIGN.md is created in the current working directory

### Requirement: Screenshot archiving during distill
The skill SHALL save screenshots to the style's directory during distill for later fallback use.

#### Scenario: Screenshots saved during URL distill
- **WHEN** distill from URL completes successfully with screenshots
- **THEN** screenshots are saved to `~/.config/design-distill/<name>/screenshots/` and overwrite any previous screenshots for that style

#### Scenario: Re-distill overwrites screenshots
- **WHEN** user re-distills an existing style
- **THEN** previous screenshots are replaced with new ones. No separate cleanup needed.
