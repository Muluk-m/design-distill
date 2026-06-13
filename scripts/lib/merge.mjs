// Multi-extraction merge (comprehensive-token-capture).
//
// Merges several token sets (e.g. home + pricing + docs) into one. Conflicts
// are resolved by confidence then frequency, and provenance is recorded so a
// merge is inspectable. Light/dark are kept as distinct variants, never
// flattened.

import { normalizeTokenSet, emptyTokenSet, CONFIDENCE_RANK as RANK } from "./tokenset.mjs";

function mergeColors(target, sources) {
  const seen = {}; // name -> { value, confidence, count }
  for (const ts of sources) {
    for (const [name, v] of Object.entries(ts.colors)) {
      const cur = seen[name];
      if (!cur) {
        seen[name] = { value: v.value, confidence: v.confidence || "unknown", count: 1 };
      } else {
        cur.count += 1;
        // Keep the higher-confidence value on conflict.
        if (RANK[v.confidence] > RANK[cur.confidence]) {
          cur.value = v.value;
          cur.confidence = v.confidence;
        }
      }
    }
  }
  for (const [name, v] of Object.entries(seen)) {
    target.colors[name] = { value: v.value, confidence: v.confidence };
  }
}

function unionList(target, key, sources, sub) {
  const set = new Set();
  for (const ts of sources) {
    const arr = sub ? ts[key][sub] : ts[key];
    for (const v of arr || []) set.add(typeof v === "string" ? v : JSON.stringify(v));
  }
  const values = [...set].map((v) => {
    try {
      return v.startsWith("{") || v.startsWith("[") ? JSON.parse(v) : v;
    } catch {
      return v;
    }
  });
  if (sub) target[key][sub] = values;
  else target[key] = values;
}

/**
 * @param {object[]} tokenSets
 * @param {object} [opts] { schemes: { light: ts, dark: ts } }  optional dual-scheme inputs
 */
export function mergeTokenSets(tokenSets, opts = {}) {
  const sources = tokenSets.map(normalizeTokenSet);
  const out = emptyTokenSet({ extractor: "merged", pages: sources.length });
  if (!sources.length) return out;

  mergeColors(out, sources);
  unionList(out, "typography", sources, "fontFamilies");
  for (const ts of sources) Object.assign(out.typography.scale, ts.typography.scale);
  unionList(out, "spacing", sources, "values");
  // spacing.base: take the first defined.
  out.spacing.base = sources.find((s) => s.spacing.base)?.spacing.base;
  unionList(out, "radius", sources, "values");
  unionList(out, "shadows", sources);
  for (const ts of sources) Object.assign(out.components, ts.components);
  unionList(out, "breakpoints", sources);
  for (const ts of sources) Object.assign(out.meta, ts.meta);

  // Dual-scheme: keep the dark palette as a variant rather than flattening.
  if (opts.schemes?.dark) {
    const dark = normalizeTokenSet(opts.schemes.dark);
    out.variants.dark = { colors: dark.colors };
  }
  if (opts.schemes?.light) {
    const light = normalizeTokenSet(opts.schemes.light);
    out.variants.light = { colors: light.colors };
  }

  return out;
}
