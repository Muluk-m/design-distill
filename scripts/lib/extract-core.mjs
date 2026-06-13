// extract primitive (design-extraction).
//
// Source precedence: MCP (if configured) -> pinned dembrandt CLI -> native
// getComputedStyle fallback. Emits the stable token-set shape and preserves
// per-token confidence when the source provides it. Never hard-crashes: a
// failing/empty source falls through to the next.

import { emptyTokenSet, normalizeTokenSet } from "./tokenset.mjs";

const VALID_CONFIDENCE = new Set(["high", "medium", "low"]);

function asArray(v) {
  if (Array.isArray(v)) return v;
  if (v && typeof v === "object") return Object.values(v);
  return [];
}

function pickColorValue(entry) {
  if (typeof entry === "string") return entry;
  // Prefer the normalized hex when dembrandt provides it.
  return entry?.normalized ?? entry?.value ?? entry?.hex ?? entry?.color ?? null;
}

function pickConfidence(entry) {
  const c = entry && typeof entry === "object" ? entry.confidence : undefined;
  return VALID_CONFIDENCE.has(c) ? c : "unknown";
}

// Map dembrandt's JSON (CLI --json-only or MCP result) into our token set.
// Defensive: dembrandt's shape varies across versions, so every access is
// guarded and unknown bits are skipped rather than throwing.
export function mapDembrandtJson(json, source = {}) {
  const ts = emptyTokenSet({ extractor: "dembrandt", ...source });
  if (!json || typeof json !== "object") return ts;

  // Colors: prefer colors.palette, fall back to colors.semantic / cssVariables.
  const colors = json.colors || {};
  const palette = asArray(colors.palette);
  palette.forEach((entry, i) => {
    const value = pickColorValue(entry);
    if (!value) return;
    const name = entry?.name || entry?.role || `palette-${i + 1}`;
    ts.colors[name] = { value, confidence: pickConfidence(entry) };
  });
  if (colors.semantic && typeof colors.semantic === "object") {
    for (const [role, entry] of Object.entries(colors.semantic)) {
      const value = pickColorValue(entry);
      if (value) ts.colors[role] = { value, confidence: pickConfidence(entry) };
    }
  }

  // Typography. dembrandt uses styles[].family / .context / .size ("56px (3.5rem)").
  const typo = json.typography || {};
  const styles = asArray(typo.styles);
  const fams = new Set();
  for (const s of styles) {
    const family = s?.family ?? s?.fontFamily;
    if (family) fams.add(family);
    const ctx = s?.context;
    const size = s?.size ?? s?.fontSize;
    if (ctx && size) {
      ts.typography.scale[ctx] = {
        size,
        weight: s.weight ?? s.fontWeight,
        lineHeight: s.lineHeight,
      };
    }
  }
  ts.typography.fontFamilies = [...fams];

  // Spacing.
  const spacing = json.spacing || {};
  ts.spacing.values = asArray(spacing.commonValues)
    .map((s) => (typeof s === "string" ? s : s?.value))
    .filter(Boolean);
  if (spacing.scaleType) ts.spacing.base = String(spacing.scaleType);

  // Radius.
  const radius = json.borderRadius || {};
  ts.radius.values = asArray(radius.values)
    .map((r) => (typeof r === "string" ? r : r?.value))
    .filter(Boolean);

  // Shadows. dembrandt uses shadows[].shadow.
  ts.shadows = asArray(json.shadows)
    .map((s) => (typeof s === "string" ? s : s?.shadow ?? s?.value))
    .filter(Boolean);

  // Breakpoints + framework/icon context (comprehensive-extraction).
  ts.breakpoints = asArray(json.breakpoints)
    .map((b) => (typeof b === "string" ? b : b?.value ?? b?.minWidth))
    .filter(Boolean);
  // frameworks / iconSystem are arrays of { name, confidence, evidence }.
  const firstName = (v) => {
    if (!v) return undefined;
    if (typeof v === "string") return v;
    if (Array.isArray(v)) return v[0]?.name ?? (typeof v[0] === "string" ? v[0] : undefined);
    return v.name;
  };
  const fw = firstName(json.frameworks ?? json.framework);
  if (fw) ts.meta.framework = fw;
  const icons = firstName(json.iconSystem);
  if (icons) ts.meta.iconSystem = icons;

  // Components (buttons/inputs/links). dembrandt nests props under
  // states.default with camelCase keys; older shapes put them flat.
  const comps = json.components || {};
  for (const kind of ["buttons", "inputs", "links", "badges"]) {
    const variants = asArray(comps[kind]);
    const v = variants.find((x) => x && typeof x === "object");
    if (!v) continue;
    const src = v.states?.default ?? v.default ?? v;
    const props = {};
    const pick = (out, ...keys) => {
      for (const k of keys) if (src[k] != null) return (props[out] = String(src[k]));
    };
    pick("background", "background", "backgroundColor");
    pick("color", "color");
    pick("padding", "padding");
    pick("borderRadius", "borderRadius");
    pick("border", "border");
    pick("fontWeight", "fontWeight");
    pick("fontSize", "fontSize");
    if (Object.keys(props).length) ts.components[kind.replace(/s$/, "")] = props;
  }

  return ts;
}

// Build a token set from a raw getComputedStyle dump produced in the page
// (the native fallback). Confidence is unknown on this path.
export function mapNativeComputed(data, source = {}) {
  const ts = emptyTokenSet({ extractor: "native", ...source });
  if (!data || typeof data !== "object") return ts;

  for (const [name, value] of Object.entries(data.cssVariables || {})) {
    if (typeof value === "string" && value.trim()) {
      ts.colors[name] = { value: value.trim(), confidence: "unknown" };
    }
  }
  asArray(data.colors).forEach((c, i) => {
    if (typeof c === "string") ts.colors[`color-${i + 1}`] = { value: c, confidence: "unknown" };
  });
  if (Array.isArray(data.fontFamilies)) ts.typography.fontFamilies = data.fontFamilies.slice();
  if (Array.isArray(data.spacing)) ts.spacing.values = data.spacing.slice();
  if (Array.isArray(data.radius)) ts.radius.values = data.radius.slice();
  if (Array.isArray(data.shadows)) ts.shadows = data.shadows.slice();
  return ts;
}

export function isEmptyTokenSet(ts) {
  if (!ts) return true;
  const n = normalizeTokenSet(ts);
  return (
    Object.keys(n.colors).length === 0 &&
    n.typography.fontFamilies.length === 0 &&
    n.spacing.values.length === 0 &&
    n.radius.values.length === 0 &&
    n.shadows.length === 0 &&
    Object.keys(n.components).length === 0
  );
}

// dembrandt-mcp async job protocol: submit -> poll get_job_status -> result.
// `client` is any object exposing the MCP tool callable; this stays testable
// with a fake client. In bundled-script context no MCP client is wired, so the
// default mcp runner returns null and we fall through to CLI.
export async function pollMcpJob(client, { maxPolls = 30, onPoll } = {}) {
  if (!client || typeof client.submit !== "function" || typeof client.status !== "function") {
    return null;
  }
  const submitted = await client.submit();
  if (!submitted || !submitted.job_id) {
    // Some servers may return a synchronous result directly.
    return submitted && submitted.result ? submitted.result : null;
  }
  for (let i = 0; i < maxPolls; i++) {
    const s = await client.status(submitted.job_id);
    if (onPoll) onPoll(i, s);
    if (s && s.status === "completed") return s.result ?? null;
    if (s && s.status === "failed") return null;
  }
  return null;
}

/**
 * Orchestrate extraction with source precedence. Runners are injectable for
 * tests; each returns a token set or null (unavailable/failed/empty).
 * @param {string} target
 * @param {object} [opts] { runners: {mcp, cli, native}, log }
 */
export async function extractTokens(target, opts = {}) {
  const runners = opts.runners || {};
  const log = opts.log || (() => {});
  const order = [
    ["mcp", runners.mcp],
    ["cli", runners.cli],
    ["native", runners.native],
  ];
  for (const [name, runner] of order) {
    if (typeof runner !== "function") continue;
    try {
      const result = await runner(target);
      if (result && !isEmptyTokenSet(result)) {
        log(`extract: using ${name}`);
        return normalizeTokenSet(result);
      }
      log(`extract: ${name} produced no tokens, falling through`);
    } catch (err) {
      log(`extract: ${name} failed (${err?.message || err}), falling through`);
    }
  }
  // Nothing worked: return a normalized empty set rather than throwing.
  return emptyTokenSet({ target, extractor: "none" });
}
