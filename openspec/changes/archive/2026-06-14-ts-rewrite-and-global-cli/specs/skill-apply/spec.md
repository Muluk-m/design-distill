## MODIFIED Requirements

### Requirement: CLI invocation without npx
The design-apply SKILL.md SHALL invoke the CLI as `design-distill` (without `npx` prefix) for all commands: `path`, `show`, `list`.

#### Scenario: Skill resolves style path
- **WHEN** skill checks if a named style exists
- **THEN** it executes `design-distill path <name> 2>/dev/null` (not `npx design-distill path <name>`)

#### Scenario: Skill loads style content
- **WHEN** skill loads a design system by name
- **THEN** it executes `design-distill show <name>` (not `npx design-distill show <name>`)

#### Scenario: Skill lists available styles
- **WHEN** no style is specified and no local DESIGN.md exists
- **THEN** it executes `design-distill list` (not `npx design-distill list`)
