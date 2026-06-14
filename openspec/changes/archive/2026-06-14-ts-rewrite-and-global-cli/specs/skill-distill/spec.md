## MODIFIED Requirements

### Requirement: CLI invocation without npx
The design-distill SKILL.md SHALL invoke the CLI as `design-distill` (without `npx` prefix) for all commands: `list`, `path`, `show`.

#### Scenario: Skill lists styles
- **WHEN** skill runs the list command
- **THEN** it executes `design-distill list` (not `npx design-distill list`)

#### Scenario: Skill checks style path
- **WHEN** skill verifies a style exists
- **THEN** it executes `design-distill path <name> 2>/dev/null` (not `npx design-distill path <name>`)

#### Scenario: CLI not available
- **WHEN** skill runs `design-distill list` and the command is not found
- **THEN** skill suggests "Run `npx design-distill init` to install the CLI globally"
