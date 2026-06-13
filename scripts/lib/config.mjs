// Shared configuration for the bundled primitive scripts.
//
// Runtime decision (resolves design open question): the primitives ship as
// zero-build ESM `.mjs` modules under `scripts/`, invoked via Bash by the
// skills. Core logic lives in `scripts/lib/*` as pure modules so it stays
// unit-testable with vitest; the top-level `scripts/*.mjs` files are thin
// CLI wrappers.

// dembrandt is invoked via `npx dembrandt@<PINNED>` rather than floating to
// latest. dembrandt is a pre-1.0 tool that shipped 12 releases in ~3 weeks;
// pinning insulates us from silent flag/output drift.
//
// Bump policy: bumping DEMBRANDT_VERSION is a deliberate, reviewed change.
// Re-run the bundled-style fixtures and the extract tests against the new
// version before committing a bump.
export const DEMBRANDT_VERSION = "0.18.0";

export function dembrandtSpec() {
  return `dembrandt@${DEMBRANDT_VERSION}`;
}

// Library location convention. Honors DESIGN_DISTILL_HOME, falling back to
// ~/.config/design-distill/ (matches the legacy store behavior).
export function libraryHome() {
  const env = process.env.DESIGN_DISTILL_HOME;
  if (env && env.trim()) return env;
  const home = process.env.HOME || process.env.USERPROFILE || "";
  return `${home}/.config/design-distill`;
}

// Capability tiers, ordered most → least capable.
export const TIERS = Object.freeze({
  FULL: "full", // extraction + visual capture
  BASIC: "basic", // extraction + screenshot, single page
  TOKEN_ONLY: "token-only", // extraction only, no rendering
});

// Default viewports used by visual-capture.
export const VIEWPORTS = Object.freeze({
  desktop: { width: 1920, height: 1080 },
  mobile: { width: 390, height: 844 },
});
