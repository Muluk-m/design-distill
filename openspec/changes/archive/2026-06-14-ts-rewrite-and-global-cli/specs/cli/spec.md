## MODIFIED Requirements

### Requirement: init installs CLI globally
The `init` command SHALL run `npm install -g design-distill` to place the CLI binary in the user's global PATH. This step SHALL run before installing dembrandt and Playwright. If the CLI is already globally available, this step SHALL be skipped.

#### Scenario: First time init
- **WHEN** user runs `npx design-distill init` and `design-distill` is not in PATH
- **THEN** system runs `npm install -g design-distill` and reports "✓ design-distill: installed globally"

#### Scenario: CLI already installed
- **WHEN** user runs `design-distill init` and `design-distill` is already in PATH
- **THEN** system reports "✓ design-distill: already available" and skips installation

#### Scenario: Global install fails due to permissions
- **WHEN** `npm install -g design-distill` fails with EACCES
- **THEN** system reports the error and suggests "Try: sudo npm install -g design-distill, or use nvm to manage Node.js"

### Requirement: bin entry points to build output
The package.json `bin` field SHALL point to `./dist/cli.mjs` instead of `./bin/cli.js`. The `bin/` directory SHALL be removed from the project.

#### Scenario: CLI invocation after npm install -g
- **WHEN** user runs `design-distill --help` after global install
- **THEN** the CLI displays help text with all subcommands listed

### Requirement: All command source files are TypeScript
Every file under `src/` SHALL be TypeScript (`.ts` extension). All function parameters, return types, and exported interfaces SHALL have explicit type annotations.

#### Scenario: Command types are explicit
- **WHEN** reviewing any command file (init, list, show, remove, path, diff, preview)
- **THEN** all functions have parameter types and return types annotated
