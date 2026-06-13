# Design Distill

**Stop generating generic-looking UIs.** Distill any website's real design system into a structured `DESIGN.md`, then generate code that actually matches.

```
You:    "Distill linear.app, then make me a settings page"
Agent:  → extracts colors, fonts, spacing, components from linear.app
        → saves as DESIGN.md (Stitch-compatible)
        → generates a settings page that looks like Linear, not like every other AI output
```

![Without vs With Design Distill](docs/demo-comparison.png)

*Same prompt: "Make a settings page like Linear." Left: generic AI output. Right: with Design Distill.*

## The Problem

Every AI-generated UI looks the same. Same gradients, same rounded cards, same blue buttons. You ask for "a settings page like Linear" and get generic Material Design.

Design Distill solves this by extracting the *real* design tokens from a live site and constraining generation to that palette.

## Install

```bash
# Install skills (design-distill + design-apply)
npx skills add Muluk-m/design-distill

# One-time bootstrap: ensures a browser + seeds the bundled styles
node scripts/setup.mjs
```

The skill is self-contained — there's no global CLI to install. `setup.mjs`
**reuses a browser you already have** (system Chrome/Edge, or a CDP endpoint via
`DESIGN_DISTILL_CDP`) and only downloads Chromium when none is found. 5 bundled
design systems (GitHub, Linear, Notion, Stripe, Vercel) are seeded into the
library (`~/.config/design-distill/`, overridable via `DESIGN_DISTILL_HOME`).

## Two Skills, One Library

```
  design-distill                    design-apply
  ──────────────                    ────────────
  "Distill linear.app"              "用 linear 做个博客主页"
        │                                 │
        ▼                                 ▼
  ┌──────────────┐               ┌──────────────────┐
  │  dembrandt   │               │  Load DESIGN.md   │
  │  (tokens)    │               │       +           │
  │      +       │── global ──▶  │  Re-screenshot    │
  │  screenshots │    library    │  source site      │
  │  (visual)    │               └──────────────────┘
  └──────────────┘                       │
                                         ▼
                                   Code that looks
                                   like the original
```

### design-distill — Extract Design Systems

Extracts design tokens via [dembrandt](https://github.com/nicholasgriffintn/dembrandt) + screenshots for visual ground truth. Outputs a [Stitch-compatible](https://stitch.withgoogle.com/docs/design-md/overview) `DESIGN.md` to the global library.

```
design-distill https://linear.app     # extract from URL → save to library
design-distill ./my-app               # extract from local project
```

### design-apply — Generate with Style Consistency

Loads a design system, re-screenshots the source site for visual calibration, generates code strictly constrained to the original palette, fonts, and component patterns.

```
design-apply 用 linear 做个博客主页    # load from library by name
design-apply 做个登录页                # auto-loads local ./DESIGN.md
```

### Library & primitives

The library is plain files under `~/.config/design-distill/<name>/`
(`tokens.json` is canonical, `DESIGN.md` is the rendered view) — list/show/remove
with ordinary file commands (`ls`, `cat`, `rm`). The skill ships bundled
primitives instead of a global CLI:

```bash
node scripts/setup.mjs --probe        # report capability tier + browser source
node scripts/extract.mjs <url>        # extract a token set (MCP → dembrandt → native)
node scripts/build-design.mjs --out <dir>   # normalize → tokens.json + DESIGN.md
node scripts/screenshot.mjs <url> --out <dir>
node scripts/compare.mjs <ref.json> <cand.json>
node scripts/diff.mjs <name>          # drift: saved vs. live source
node scripts/verify.mjs <tokens.json> <output>   # visual-verification loop round
```

## Architecture

No global CLI — the skills are self-contained and call zero-build `.mjs`
primitives directly. One browser dependency (reused from the system or
downloaded once).

```
design-distill/
├── scripts/                   ← bundled primitives (run via `node`, no build step)
│   ├── setup.mjs              ← bootstrap: reuse/ensure a browser + seed styles
│   ├── extract.mjs            ← tokens (MCP → pinned dembrandt → native fallback)
│   ├── build-design.mjs       ← normalize → tokens.json (canonical) + DESIGN.md
│   ├── screenshot.mjs         ← full-page / multi-viewport / light-dark capture
│   ├── compare.mjs            ← per-category thresholded fidelity diff
│   ├── verify.mjs             ← closed visual-verification loop (one round)
│   ├── diff.mjs · preview.mjs ← drift detection · HTML preview
│   └── lib/                   ← target, color, tokenset, semantic, wcag, merge, probe …
├── skills/
│   ├── design-distill/        ← extraction skill (+ references/template.md)
│   └── design-apply/          ← generation skill (closed visual loop)
├── tests/                     ← vitest (unit + browser integration)
├── bundled/                   ← snapshots (github, linear, notion, stripe, vercel)
└── package.json
```

**Skills** handle AI behavior; **bundled scripts** handle deterministic work
(extraction, capture, comparison); **tokens.json** is canonical and **DESIGN.md**
is its rendered view.

## Development

```bash
npm test               # vitest (unit + browser integration via system Chrome/Playwright)
node scripts/setup.mjs --probe   # show capability tier + browser source
```

## Compatibility

Works with **Claude Code**, **Codex**, **Openclaw**, and any agent that supports [skills](https://skills.sh).

Output follows the [Google Stitch DESIGN.md specification](https://stitch.withgoogle.com/docs/design-md/overview).

## License

MIT
