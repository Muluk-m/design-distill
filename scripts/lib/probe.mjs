// Capability probe + tier selection (environment-bootstrap).
//
// Detects what rendering/extraction capability is available and picks an
// explicit tier so the skills degrade rather than crash. Probing treats any
// uncertainty as "absent" (defensive: a failed probe must never become a
// later hard crash).

import { TIERS } from "./config.mjs";

/**
 * @param {object} [opts] injectable detectors for tests
 *   { hasBrowser: () => Promise<boolean>, hasExtractor: () => Promise<boolean> }
 * @returns {Promise<{browser:boolean, extractor:boolean, tier:string}>}
 */
export async function probe(opts = {}) {
  const hasBrowser = opts.hasBrowser || defaultHasBrowser;

  let browser = false;
  try {
    browser = !!(await hasBrowser());
  } catch {
    browser = false;
  }

  // Extraction is possible whenever a browser is present (native fallback).
  // If a caller wants to probe a browserless extractor (e.g. a configured MCP
  // server), it can inject hasExtractor; otherwise we reuse the browser result
  // instead of launching a second browser.
  let extractor = browser;
  if (opts.hasExtractor) {
    try {
      extractor = !!(await opts.hasExtractor());
    } catch {
      extractor = false;
    }
  }

  let source = null;
  if (browser && !opts.hasBrowser) {
    try {
      const { browserSource } = await import("./browser.mjs");
      source = await browserSource();
    } catch {
      source = null;
    }
  }

  return { browser, extractor, source, tier: selectTier({ browser, extractor }) };
}

export function selectTier({ browser, extractor }) {
  // A browser implies we can also extract natively, so visual capability is
  // the deciding axis for full vs token-only.
  if (browser) return TIERS.FULL;
  if (extractor) return TIERS.TOKEN_ONLY;
  // No browser and no dembrandt: native extraction also needs a browser, so
  // there is effectively no capability. Report token-only and let callers
  // surface the bootstrap remediation.
  return TIERS.TOKEN_ONLY;
}

async function defaultHasBrowser() {
  const { browserAvailable } = await import("./browser.mjs");
  return browserAvailable();
}
