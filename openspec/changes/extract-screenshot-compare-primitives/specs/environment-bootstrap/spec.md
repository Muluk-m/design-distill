## ADDED Requirements

### Requirement: Capability probing

The bootstrap layer SHALL detect which rendering and extraction capabilities are available in the current environment before the skills attempt to use them, and SHALL expose the detected capability to the skills.

#### Scenario: Browser available
- **WHEN** a usable browser (bundled Chromium) is present
- **THEN** probing reports that visual capture is available

#### Scenario: Browser missing
- **WHEN** no usable browser is present
- **THEN** probing reports that visual capture is unavailable rather than letting a later call crash

### Requirement: Reuse before install

The bootstrap layer SHALL detect an already-usable browser (a CDP endpoint, a system Chrome/Edge, or a previously-installed Chromium) and, when one is present, SHALL skip installation entirely.

#### Scenario: Existing browser present
- **WHEN** a usable browser already exists (e.g., system Chrome)
- **THEN** bootstrap reports success without downloading Chromium, and names the source it will use

### Requirement: Bulletproof dependency setup

When no usable browser is found, the bootstrap layer SHALL install the browser dependency, and when it cannot, SHALL emit a single clear remediation command instead of surfacing a raw library stack trace.

#### Scenario: Missing browser is auto-installed
- **WHEN** no usable browser exists and installation is possible
- **THEN** the bootstrap installs Chromium (e.g., via `playwright install chromium`) and proceeds

#### Scenario: Installation not possible
- **WHEN** the browser cannot be installed automatically
- **THEN** the bootstrap reports a single actionable command (including the reuse options: install Chrome/Edge or set a CDP endpoint), and does not print a cryptic underlying error as the primary message

### Requirement: Explicit tiered degradation

The skills SHALL operate at an explicit capability tier selected from probing — full (multi-page/multi-viewport tokens + visual loop), basic (single-page tokens + screenshot), or token-only (no rendering) — and SHALL never hard-crash due to a missing capability.

#### Scenario: Full capability present
- **WHEN** both extraction and visual capture are available
- **THEN** the skill operates at the full tier

#### Scenario: Only token extraction present
- **WHEN** extraction works but no browser is available
- **THEN** the skill operates at the token-only tier, completes its task using token data, and clearly warns that visual validation was skipped

#### Scenario: Degradation is announced
- **WHEN** the skill runs below the full tier
- **THEN** it tells the user which tier is active and what was skipped, rather than silently producing lower-fidelity output

### Requirement: No external skill dependency

The bootstrap and the skills SHALL NOT require the external `/browse` skill or any other sibling skill to be installed in order to function.

#### Scenario: Fresh install of the skill only
- **WHEN** a user installs the design-distill / design-apply skills without installing `/browse`
- **THEN** the skills run (at the appropriate tier) without reporting a missing `/browse` dependency
