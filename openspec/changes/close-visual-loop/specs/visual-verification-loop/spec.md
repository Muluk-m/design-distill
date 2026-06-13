## ADDED Requirements

### Requirement: Render generated output for verification

The loop SHALL render the generated output so it can be captured and measured, handling both static artifacts (via `file://`) and framework projects (via a local dev server serving a URL).

#### Scenario: Static artifact
- **WHEN** the generated output is a static HTML/CSS artifact
- **THEN** the loop renders it via `file://` and captures it

#### Scenario: Framework project
- **WHEN** the generated output is a framework project (e.g., React/Next) that requires a build/serve step
- **THEN** the loop starts a local dev server, captures the served URL, and shuts the server down afterward

#### Scenario: Render failure surfaced
- **WHEN** the output cannot be rendered (build error, server fails to start)
- **THEN** the loop reports the render failure as actionable feedback instead of silently passing

### Requirement: Quantified comparison against the saved system

The loop SHALL extract tokens from the rendered output and compare them to the saved structured design system using the compare primitive, deciding pass/iterate from the per-category deltas and overall fidelity score — not from a prose checklist.

#### Scenario: Pass on threshold
- **WHEN** the overall fidelity score meets or exceeds the configured threshold
- **THEN** the loop stops and reports success

#### Scenario: Iterate on deltas
- **WHEN** the fidelity score is below threshold
- **THEN** the loop feeds the specific per-category deltas (e.g., wrong primary color, off radius, palette violation) back into a regeneration/fix step

### Requirement: Bounded iteration with convergence

The loop SHALL be bounded: it SHALL stop at a configurable iteration cap and SHALL stop early when an iteration produces no meaningful improvement over the previous one.

#### Scenario: Iteration cap
- **WHEN** the iteration cap is reached without meeting the threshold
- **THEN** the loop stops and reports the best result with its remaining deltas

#### Scenario: Convergence (no improvement)
- **WHEN** an iteration does not improve the fidelity score over the previous iteration
- **THEN** the loop stops rather than looping further

### Requirement: Auditable side-by-side evidence

The loop SHALL produce reference-vs-output evidence — screenshots of both and the final delta report — so the result can be inspected.

#### Scenario: Evidence produced
- **WHEN** the loop finishes (pass, cap, or convergence)
- **THEN** it provides the reference screenshot, the output screenshot, and the delta/score report

### Requirement: Graceful degradation without rendering

When the active capability tier has no browser, the loop SHALL fall back to a structured self-check (output tokens vs. saved system where derivable) and SHALL clearly state that visual verification was skipped, rather than failing.

#### Scenario: Token-only tier
- **WHEN** no browser is available
- **THEN** the loop performs the structured self-check it can, omits the screenshot evidence, and warns that visual verification was skipped

#### Scenario: Never silently downgrade
- **WHEN** the loop runs below full visual verification
- **THEN** it explicitly states which checks were performed and which were skipped
