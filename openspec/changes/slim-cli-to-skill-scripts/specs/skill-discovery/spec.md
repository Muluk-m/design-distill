## ADDED Requirements

### Requirement: Rich discovery frontmatter

Each skill SHALL carry discovery frontmatter beyond name/description: prompt signals (trigger phrases), retrieval aliases/intents/examples, and metadata including a dembrandt version constraint where relevant.

#### Scenario: Trigger phrases present
- **WHEN** the skill frontmatter is inspected
- **THEN** it includes prompt-signal phrases and retrieval aliases/intents/examples that describe when the skill applies

#### Scenario: Version constraint declared
- **WHEN** a skill depends on dembrandt
- **THEN** its metadata declares the required dembrandt version

### Requirement: Lean SKILL.md with progressive disclosure

Each skill's SKILL.md SHALL stay lean, deferring long procedural detail and design principles to `references/` files loaded on demand.

#### Scenario: Detail lives in references
- **WHEN** a skill needs extended detail (e.g., normalization rules, contrast rules, fallback procedures)
- **THEN** that detail lives in a `references/` file the skill loads when needed, not inline in SKILL.md

#### Scenario: SKILL.md is an entry point
- **WHEN** SKILL.md is read
- **THEN** it provides the workflow and points to references, rather than embedding all procedural depth
