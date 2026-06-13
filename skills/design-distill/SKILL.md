---
name: design-distill
description: |
  Extract a design system from a website URL or local project into a structured token set
  (tokens.json, canonical) + a rendered DESIGN.md (Google Stitch-compatible) with semantic
  roles, essence, and a WCAG audit. Saves to the global library only
  (~/.config/design-distill/<name>/), never to the project root.
  When invoked without arguments, lists all saved design systems.
argument-hint: "<URL 或本地项目路径>"
metadata:
  requires: "dembrandt>=0.18 (optional; native getComputedStyle fallback otherwise) + a browser (system Chrome/Edge, CDP, or Playwright Chromium)"
  references:
    - references/template.md
  promptSignals:
    phrases:
      - "distill"
      - "extract design"
      - "design tokens"
      - "design system from"
      - "reverse engineer design"
      - "copy the design"
      - "what colors does"
      - "what fonts does"
      - "蒸馏"
      - "提取设计"
retrieval:
  aliases:
    - distill a design system
    - extract design tokens from a site
    - reverse engineer a website's design
    - build DESIGN.md from a URL
  intents:
    - extract a site's real design tokens into a reusable design system
    - seed a design library from an existing product
    - capture colors, fonts, spacing, components from a URL or local project
  examples:
    - distill linear.app
    - extract the design system from stripe.com
    - 蒸馏 https://vercel.com
    - distill ./my-app
---

# Design Distill

## No-Argument Behavior: List Styles

When invoked without arguments, list all saved styles with agent-native file ops:

```bash
ls -1 ~/.config/design-distill/ 2>/dev/null   # honors $DESIGN_DISTILL_HOME
```

If the library directory is empty or missing, suggest running `node scripts/setup.mjs` to seed the bundled styles (github, linear, notion, stripe, vercel).

Display the result and ask what the user wants to do next.

---

## Distill from URL

### Step 1: Confirm Source

If the user provided a URL, use it directly. Otherwise ask:
- Website URL?
- Style name? (default: derive from domain, e.g., `https://linear.app` → `linear`)

### Step 2: Bootstrap & Probe

The skill is self-contained — it does **not** depend on any external `/browse` skill. It ships bundled primitives under `scripts/` (run via `node`) backed by a single browser dependency (Playwright/Chromium).

First ensure the environment and learn the capability tier:

```bash
node scripts/setup.mjs --probe       # → { browser, extractor, source, tier }
# If browser is false and you want visual capture:
node scripts/setup.mjs               # reuses system Chrome/Edge or a CDP endpoint if present;
                                     # only downloads Chromium when no browser is found. Also seeds bundled styles.
```

The skill reuses a browser you already have — set `DESIGN_DISTILL_CDP=<ws-endpoint>` to attach to a running browser, or just have Chrome/Edge installed. No forced 150MB download when a usable browser exists.

- `tier: "full"` → extract + screenshots (best fidelity)
- `tier: "token-only"` → extraction only; **tell the user visual validation was skipped**

### Step 3: Extract Tokens + Capture Pixels

1. **Extract tokens** (source precedence MCP → pinned dembrandt → native fallback, all handled inside the primitive):
   ```bash
   node scripts/extract.mjs <url>      # → stable token-set JSON on stdout
   ```
   The JSON contains `colors` (with confidence), `typography`, `spacing`, `radius`, `shadows`, `components`.

   **Comprehensive capture (opt-in — heavier, only when the request needs it):**
   ```bash
   node scripts/extract.mjs <url> --crawl 3   # multiple pages, merged
   node scripts/extract.mjs <url> --dark-mode # also capture the dark palette (kept as a variant)
   node scripts/extract.mjs <url> --mobile --slow --cookie "<s>" --header "<h>"
   ```
   Cost rule of thumb (each multiplies the dembrandt run): default single-page ≈ 1×; `--crawl N` ≈ N×; `--dark-mode` adds a second full run; `--slow` ≈ 3× timeouts. Default to single-page light unless the task needs breadth.

2. **Capture screenshots for visual ground truth** (full-tier only) with the bundled primitive — **not** `/browse`:
   ```bash
   node scripts/screenshot.mjs <url> --out <dir> --viewports desktop,mobile --schemes light
   ```
   - Observe the real background color (light or dark? don't guess from the brand name)
   - Capture 1-2 representative subpages (e.g., /pricing, /docs) by re-running with their URLs

3. **Combine both sources:**
   - Use the extracted exact values (hex colors, px/rem sizes, font names) for the data
   - Use screenshots to validate: overall lightness/darkness, visual density, design personality
   - When they conflict, trust the screenshot

If the site has `/design`, `/brand`, `/style-guide`, or `/storybook`, capture those too.

**Screenshots are primary.** On `token-only` tier (no browser), proceed from token data alone and clearly note that visual validation was skipped.

### Step 4: Normalize + Generate (structured-first)

The canonical artifact is a **structured token set** (`tokens.json`); `DESIGN.md` is rendered from it. Pipe the extracted tokens through `build-design`, which applies semantic normalization (raw → roles + decision rules), derives the essence, and renders the document:

```bash
node scripts/extract.mjs <url> \
  | node scripts/build-design.mjs --name <name> --source-url <url> --out ~/.config/design-distill/<name>
# writes ~/.config/design-distill/<name>/tokens.json (canonical) + DESIGN.md (view)
```

`build-design` records every role assignment / override in `tokens.json.decisions` and the rendered "Normalization decisions" section, so the result is inspectable.

**Key principles:**
- Every value must be concrete — `#1a1a2e`, not "a dark blue"
- Visual judgments (light/dark, personality) come from screenshots — read them and correct the rendered tone/essence if the data disagrees
- `tokens.json` is canonical; never hand-edit `DESIGN.md` as the source — re-render it
- `source_url` is recorded for design-apply to re-screenshot

### Step 5: Save to Global Library Only

**Derive default style name:**
- URL source: extract domain without TLD (e.g., `https://linear.app` → `linear`)
- Confirm with user

**Check for collision** with agent-native file ops (the library lives at `~/.config/design-distill/`, overridable via `DESIGN_DISTILL_HOME`):
```bash
ls ~/.config/design-distill/<name>/DESIGN.md 2>/dev/null
```

If the style exists, ask: "Style `<name>` already exists. Overwrite or choose a different name?"

**Save** — write the DESIGN.md directly:
```bash
mkdir -p ~/.config/design-distill/<name>
# Write DESIGN.md content to ~/.config/design-distill/<name>/DESIGN.md
```

**Save screenshots** to `~/.config/design-distill/<name>/screenshots/` for archival.
Previous screenshots are overwritten on re-distill.

**IMPORTANT: Do NOT write DESIGN.md to the project root directory.**
The distilled design system belongs to the global library, not the current project.

**Completion message:**
> "Saved to global library as `<name>`. Use `design-apply 用 <name> 做个 <页面>` to generate with this style."

---

## Distill from Local Project

### Step 1: Read Design Sources

Read in priority order:

```bash
# 1. Tailwind config (richest source)
find . -name "tailwind.config.*" -not -path "*/node_modules/*" | head -3

# 2. CSS custom properties
grep -r "^:root\|^html" --include="*.css" --include="*.scss" -l | head -10

# 3. Design token files
find . -name "tokens.*" -o -name "design-tokens.*" -o -name "theme.*" \
  -not -path "*/node_modules/*" | head -5

# 4. Component sampling
find . -path "*/components/*" \( -name "Button*" -o -name "Card*" \) | head -5
```

### Step 2: Generate and Save

Same as URL flow Step 4-5, but:
- Style name defaults to directory name (e.g., `./my-app` → `my-app`)
- No `source_url` in header (local projects don't have one)
- No screenshots to archive
