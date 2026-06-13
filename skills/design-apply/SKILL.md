---
name: design-apply
description: |
  Generate style-consistent frontend code using a saved design system (tokens.json + DESIGN.md)
  from the global library or a local DESIGN.md. Loads the design system + semantic roles + essence,
  re-screenshots the source for visual calibration, generates code constrained to the palette,
  typography, and component language, then runs a closed visual-verification loop (render →
  measure → iterate) instead of an eyeball checklist.
argument-hint: "用 <风格名> 做一个 <页面描述>"
metadata:
  requires: "a saved design system (run design-distill first) + a browser for the visual loop (degrades to token-only)"
  promptSignals:
    phrases:
      - "用 ... 做"
      - "build ui"
      - "make a ... like"
      - "generate a page"
      - "match this brand"
      - "用 linear 做"
      - "做个 ... 页面"
      - "apply the design"
retrieval:
  aliases:
    - generate UI matching a saved style
    - build a page in a distilled design system
    - apply a design system to new code
  intents:
    - generate frontend code that matches a saved design system
    - build a page that looks like a specific brand/site
    - produce style-consistent UI from tokens.json + DESIGN.md
  examples:
    - 用 linear 做个博客主页
    - make a settings page like Stripe
    - 用 vercel 做个登录页
---

# Design Apply

## Step 1: Load Design System

Resolve the design system based on priority:

The library lives at `~/.config/design-distill/` (override with `$DESIGN_DISTILL_HOME`). Resolve with ordinary file ops — there is no CLI.

### Priority 1: Explicit style name from user input

If the user mentions a style name (e.g., "用 linear 做个博客主页"), read its structured set + view:

```bash
DIR="${DESIGN_DISTILL_HOME:-$HOME/.config/design-distill}/<name>"
cat "$DIR/tokens.json"   # canonical: semantic roles + essence (preferred)
cat "$DIR/DESIGN.md"     # rendered view
```

If the directory doesn't exist, list available styles and report:
```bash
ls -1 "${DESIGN_DISTILL_HOME:-$HOME/.config/design-distill}"
```

### Priority 2: Local `./DESIGN.md`

If no explicit style name but `./DESIGN.md` exists in the current project:

```bash
cat ./DESIGN.md
```

This is the project's own design system (e.g., the user is building a product and has documented their own design language).

### Priority 3: No style available

If neither an explicit name nor a local DESIGN.md:

```bash
ls -1 "${DESIGN_DISTILL_HOME:-$HOME/.config/design-distill}"
```

Display available styles and ask the user to choose one. If none exist, suggest running `design-distill` first.

---

## Step 2: Re-Screenshot Source for Visual Calibration

Extract the `source_url` field from the loaded DESIGN.md.

### If source_url is present

Use the bundled `screenshot` primitive (self-contained — **no `/browse` dependency**) to capture the source:

```bash
node scripts/screenshot.mjs <source_url> --out <tmpdir> --viewports desktop --schemes light
# For a specific page type (e.g., pricing), re-run with that subpage URL
```

Load the captured images with the Read tool — **look at the reference images** before designing.

If `node scripts/setup.mjs --probe` reports `tier: "token-only"` (no browser), skip screenshots and design from the DESIGN.md values, clearly noting that visual calibration was skipped.

Why re-screenshot? Text descriptions drift toward stereotypes ("developer tool = dark mode"), while screenshots are facts. Vercel's default is light mode.

### If re-screenshot fails (404, timeout, site unreachable)

**Fallback to archived screenshots:**

Check if archived screenshots exist:
```bash
ls ~/.config/design-distill/<name>/screenshots/ 2>/dev/null
```

If archived screenshots exist:
- Load them for visual calibration
- Warn: "Using archived screenshots (source site unavailable)"

If no archived screenshots:
- Generate based on document values only
- Warn: "Source site unavailable, no archived screenshots. Generating from document values only."

### If no source_url

The design system was extracted from a local project. Generate based on document values only, without screenshots.

---

## Step 3: Style Calibration

Prefer the structured `tokens.json` (next to `DESIGN.md`) when present — it carries the **semantic roles** (`color-primary`, `color-surface`, `color-text`, …) and the **essence** (the ≤5 defining traits). Generate against the semantic roles, not raw hex guesses.

Looking at the screenshots (if available), `tokens.json`, and `DESIGN.md`, identify:

- **Essence first**: the ≤5 traits from `tokens.json.essence` — these define the look; honor them above incidental detail
- **Semantic roles**: which color plays `primary` / `surface` / `text` / status — map UI elements to roles, not to arbitrary palette entries
- **Core visual facts**: background light or dark? primary font? CTA color?
- **Anti-patterns** — what this design would never do (from the document's Anti-patterns section)

---

## Step 4: Generate

Produce frontend code, HTML, or design artifacts based on the user's request.

**Constraints:**
- Map elements to **semantic roles** (primary CTA → `color-primary`, page bg → `color-surface`, body → `color-text`) — colors come from the palette, no new colors
- Fonts must match the document's font families
- Reference the screenshot's actual proportions and visual density
- Component shapes follow the document's component vocabulary and `radius-button`/`radius-card`

---

## Step 5: Closed Visual-Verification Loop

Do **not** rely on an eyeball checklist. Render the generated output, measure it against the saved design system, and iterate on the concrete deltas until it converges.

Render target: a static artifact via its `file://` path; a framework project via a local dev server URL.

```bash
node scripts/verify.mjs ~/.config/design-distill/<name>/tokens.json <output.html|url> --out <evidence-dir>
# prints { score, pass, totalDeltas, instructions[], evidence }; exit 0 = pass
```

Loop (bounded + convergent — defaults: threshold 85, cap 3 iterations, stop on no-improvement):

1. Run `verify.mjs`. If `pass` (score ≥ threshold) → done; present the result + evidence.
2. Else apply the returned `instructions` (e.g. "color-primary should be #5e6ad2 (got #ff0000)") to the code and re-run.
3. Stop at the iteration cap or when the score stops improving; present the **best** round with its remaining deltas.

**Degradation:** if `verify.mjs` reports `visualVerification: false` (no browser), it ran a token-only check and skipped screenshots — **tell the user visual verification was skipped** rather than implying it passed visually.
