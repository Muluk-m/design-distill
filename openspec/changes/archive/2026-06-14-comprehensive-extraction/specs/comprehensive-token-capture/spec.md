## ADDED Requirements

### Requirement: Multi-page merged extraction

Distillation SHALL be able to extract tokens from multiple representative pages of a source and merge them into a single structured token set, rather than capturing the homepage only.

#### Scenario: Crawl and merge
- **WHEN** distillation runs with multi-page capture against a site
- **THEN** it extracts tokens from several representative pages (e.g., home, pricing, docs/app) and merges them into one structured set

#### Scenario: Page discovery
- **WHEN** multi-page capture is requested
- **THEN** pages are discovered via crawl or sitemap up to a configured limit

### Requirement: Light and dark scheme capture

Distillation SHALL capture both light and dark color schemes when the source provides them and record both variants in the structured set.

#### Scenario: Dual-scheme site
- **WHEN** a source supports both light and dark modes
- **THEN** the structured set records both color variants rather than a single assumed mode

#### Scenario: Single-scheme site
- **WHEN** a source supports only one scheme
- **THEN** distillation records that scheme and notes the absence of the other

### Requirement: Multi-viewport capture

Distillation SHALL capture at desktop and mobile viewports and record responsive breakpoints derived from the source.

#### Scenario: Desktop and mobile
- **WHEN** multi-viewport capture runs
- **THEN** the structured set includes viewport-specific signals and the detected breakpoints

### Requirement: Framework and icon context

Distillation SHALL record the detected CSS framework and icon system when dembrandt identifies them.

#### Scenario: Framework detected
- **WHEN** the source uses a recognizable framework (e.g., Tailwind/shadcn/MUI)
- **THEN** the structured set records the detected framework

#### Scenario: Icon system detected
- **WHEN** a recognizable icon library is detected
- **THEN** the structured set records the icon system

### Requirement: Authenticated extraction

Distillation SHALL support authenticated pages via cookies and/or custom headers, so logged-in surfaces (e.g., an app dashboard) can be distilled.

#### Scenario: Cookie/header auth
- **WHEN** credentials are supplied as a cookie string or headers
- **THEN** distillation extracts from the authenticated page using them

### Requirement: Hard-site robustness

Distillation SHALL handle JS-heavy and slow sites with hydration waits / extended timeouts, and SHALL degrade clearly for content it cannot analyze (e.g., canvas/WebGL).

#### Scenario: Slow / JS-heavy site
- **WHEN** a site needs extended time or hydration to render
- **THEN** distillation waits appropriately before extracting rather than capturing an empty DOM

#### Scenario: Unanalyzable content
- **WHEN** the source renders via canvas/WebGL with no inspectable DOM
- **THEN** distillation reports that tokens could not be extracted for that content instead of emitting fabricated values
