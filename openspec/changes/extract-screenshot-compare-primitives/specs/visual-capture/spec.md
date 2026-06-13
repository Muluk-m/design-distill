## ADDED Requirements

### Requirement: Self-contained screenshot capability

The visual-capture primitive SHALL capture screenshots of any target through a Playwright-driven browser, and SHALL NOT depend on the external `/browse` skill or any other capability assumed to exist in the user's environment.

#### Scenario: Capture without external skills installed
- **WHEN** screenshots are requested in an environment where the `/browse` skill is not installed
- **THEN** the primitive captures the screenshots using its own browser and succeeds

### Requirement: Reuse an existing browser before downloading

The primitive SHALL prefer a browser the user already has — a CDP endpoint (e.g. `DESIGN_DISTILL_CDP` / `BROWSER_CDP_ENDPOINT`), or a system-installed Chrome/Edge via Playwright `channel` — and SHALL only fall back to downloading its own Chromium when no usable browser is found. It SHALL NOT force a download when a usable browser is already present.

#### Scenario: System Chrome already installed
- **WHEN** the user has Google Chrome (or Edge) installed but no Playwright Chromium
- **THEN** the primitive uses the system browser and does not trigger a Chromium download

#### Scenario: User-provided CDP endpoint
- **WHEN** `DESIGN_DISTILL_CDP` (or `BROWSER_CDP_ENDPOINT`) points at a running browser
- **THEN** the primitive connects to it instead of launching or downloading a browser

#### Scenario: No browser anywhere
- **WHEN** no CDP endpoint, system browser, or bundled Chromium is available
- **THEN** capture is reported unavailable (and bootstrap may install Chromium), never a silent crash

#### Scenario: Capture a live source site
- **WHEN** the primitive is invoked with a live URL
- **THEN** it produces an image file of the rendered page

#### Scenario: Capture a local generated artifact
- **WHEN** the primitive is invoked with a `file://` path to locally generated output
- **THEN** it produces an image file using the same code path as for live URLs

### Requirement: Full-page, multi-viewport, light and dark capture

The visual-capture primitive SHALL support full-page capture (not viewport-only), multiple viewports (at minimum desktop and mobile), and both light and dark color schemes, selectable per invocation.

#### Scenario: Full-page capture
- **WHEN** full-page capture is requested for a page taller than the viewport
- **THEN** the resulting image includes content below the fold, not just the initial viewport

#### Scenario: Multiple viewports
- **WHEN** desktop and mobile viewports are requested
- **THEN** the primitive produces a distinct image per requested viewport

#### Scenario: Color scheme selection
- **WHEN** dark scheme capture is requested
- **THEN** the page is rendered with `prefers-color-scheme: dark` and the image reflects the dark presentation

### Requirement: Robust rendering of dynamic content

The visual-capture primitive SHALL wait for client-side hydration before capturing and SHALL handle pages it cannot meaningfully render without producing a corrupt or empty deliverable.

#### Scenario: JavaScript-heavy page
- **WHEN** capturing a page that renders content after hydration
- **THEN** the primitive waits for the page to stabilize before taking the screenshot

#### Scenario: Unrenderable page
- **WHEN** a target cannot be rendered (e.g., navigation failure)
- **THEN** the primitive reports the failure to the caller instead of emitting a blank image as if it had succeeded
