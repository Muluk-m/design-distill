## ADDED Requirements

### Requirement: tsdown build configuration
The project SHALL use tsdown as the build tool, configured via `tsdown.config.ts`. The build SHALL produce a single ESM file at `dist/cli.mjs` with a Node.js shebang header.

#### Scenario: Build produces executable output
- **WHEN** developer runs `npm run build`
- **THEN** `dist/cli.mjs` is created with `#!/usr/bin/env node` as the first line and all commands function correctly

### Requirement: TypeScript strict mode
The project SHALL use TypeScript with `strict: true` and `noUncheckedIndexedAccess: true` in `tsconfig.json`. All source files SHALL be `.ts` with no `any` types except where interfacing with untyped external data (e.g., dembrandt JSON output).

#### Scenario: Type check passes
- **WHEN** developer runs `npx tsc --noEmit`
- **THEN** zero type errors are reported

### Requirement: Development workflow
The project SHALL include a `prepare` script in package.json that runs the build, so `npm install` in a fresh clone automatically produces `dist/cli.mjs`.

#### Scenario: Fresh clone setup
- **WHEN** developer runs `git clone` followed by `npm install`
- **THEN** `dist/cli.mjs` exists and is executable

### Requirement: Package distribution
The `files` field in package.json SHALL include `dist`, `skills`, and `bundled`. The `src` directory and `bin` directory SHALL NOT be included in the published package.

#### Scenario: Published package contents
- **WHEN** package is published to npm
- **THEN** the tarball contains `dist/cli.mjs`, `skills/`, and `bundled/` but not `src/` or `bin/`
