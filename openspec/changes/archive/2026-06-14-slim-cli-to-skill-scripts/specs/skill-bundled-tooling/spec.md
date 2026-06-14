## ADDED Requirements

### Requirement: No globally-published CLI

The project SHALL NOT require a globally-installed published CLI to function as a skill. Deterministic helpers SHALL ship as skill-bundled scripts invoked via Bash with relative paths.

#### Scenario: Fresh skill install
- **WHEN** a user installs the skills (e.g., `npx skills add …`) without a separate global CLI install
- **THEN** the skills operate using their bundled scripts and a one-time bootstrap, with no `design-distill` global binary required

#### Scenario: Algorithmic tooling retained as scripts
- **WHEN** `diff` or `preview` is needed
- **THEN** it runs as a bundled script invoked via Bash, not as a globally-installed command

### Requirement: Agent-native library management

Listing, showing, locating, and removing saved styles SHALL be performed with agent-native file operations against the library directory, rather than through dedicated CLI commands.

#### Scenario: List styles
- **WHEN** the user asks what styles are saved
- **THEN** the skill enumerates the library directory directly, without a `design-distill list` command

#### Scenario: Remove a style
- **WHEN** the user asks to remove a saved style
- **THEN** the skill deletes the style's directory directly, without a `design-distill remove` command

### Requirement: Documented directory convention with env override

The library location SHALL follow a documented convention: `~/.config/design-distill/`, overridable via `DESIGN_DISTILL_HOME`.

#### Scenario: Default location
- **WHEN** `DESIGN_DISTILL_HOME` is not set
- **THEN** the library is at `~/.config/design-distill/`

#### Scenario: Override location
- **WHEN** `DESIGN_DISTILL_HOME` is set
- **THEN** the library operates under that path instead

### Requirement: Bootstrap replaces global install

The setup step SHALL be a bootstrap that ensures the browser dependency and seeds the bundled styles into the library, and SHALL NOT install a global CLI.

#### Scenario: One-time bootstrap
- **WHEN** the user runs the bootstrap
- **THEN** Chromium is ensured and the bundled styles are seeded into the library, with no global binary installed
