// The stable, machine-readable token-set shape emitted by `extract` and
// ingested by `compare`. Keeping this in one place gives both primitives a
// single contract (design decision D2: uniform shapes enable one compare
// engine for drift + output verification).
//
// Shape:
// {
//   schema: "design-distill/tokenset@1",
//   source: { target, mode, extractor },   // provenance
//   colors:     { <name>: { value: "#rrggbb", confidence?: "high"|"medium"|"low"|"unknown" } },
//   typography: { fontFamilies: string[], scale: { <name>: { size?, weight?, lineHeight? } } },
//   spacing:    { base?: string, values: string[] },
//   radius:     { values: string[] },
//   shadows:    string[],
//   components: { <name>: { <prop>: string } },
// }

export const TOKENSET_SCHEMA = "design-distill/tokenset@1";

// Confidence ordering, shared by normalization + merge.
export const CONFIDENCE_RANK = Object.freeze({ high: 3, medium: 2, low: 1, unknown: 0 });

// Extract the leading number from a CSS length string ("16px (1rem)" → 16).
export function parsePx(v) {
  if (v == null) return null;
  const m = String(v).match(/-?\d*\.?\d+/);
  return m ? parseFloat(m[0]) : null;
}

export function emptyTokenSet(source = {}) {
  return {
    schema: TOKENSET_SCHEMA,
    source,
    colors: {},
    typography: { fontFamilies: [], scale: {} },
    spacing: { values: [] },
    radius: { values: [] },
    shadows: [],
    components: {},
    breakpoints: [],
    meta: {}, // framework, iconSystem, etc. (comprehensive-extraction)
    variants: {}, // e.g. { dark: { colors: {...} } } (comprehensive-extraction)
  };
}

// Normalize a possibly-partial object into the canonical shape so consumers
// never have to null-check every nested field.
export function normalizeTokenSet(obj = {}) {
  const base = emptyTokenSet(obj.source || {});
  if (obj.schema) base.schema = obj.schema;
  if (obj.colors && typeof obj.colors === "object") {
    for (const [k, v] of Object.entries(obj.colors)) {
      if (v == null) continue;
      base.colors[k] =
        typeof v === "string"
          ? { value: v, confidence: "unknown" }
          : { value: v.value, confidence: v.confidence || "unknown" };
    }
  }
  if (obj.typography) {
    base.typography.fontFamilies = Array.isArray(obj.typography.fontFamilies)
      ? obj.typography.fontFamilies.slice()
      : [];
    base.typography.scale =
      obj.typography.scale && typeof obj.typography.scale === "object"
        ? { ...obj.typography.scale }
        : {};
  }
  if (obj.spacing) {
    if (obj.spacing.base) base.spacing.base = obj.spacing.base;
    base.spacing.values = Array.isArray(obj.spacing.values) ? obj.spacing.values.slice() : [];
  }
  if (obj.radius && Array.isArray(obj.radius.values)) base.radius.values = obj.radius.values.slice();
  if (Array.isArray(obj.shadows)) base.shadows = obj.shadows.slice();
  if (obj.components && typeof obj.components === "object") {
    base.components = JSON.parse(JSON.stringify(obj.components));
  }
  if (Array.isArray(obj.breakpoints)) base.breakpoints = obj.breakpoints.slice();
  if (obj.meta && typeof obj.meta === "object") base.meta = { ...obj.meta };
  if (obj.variants && typeof obj.variants === "object") base.variants = JSON.parse(JSON.stringify(obj.variants));
  return base;
}
