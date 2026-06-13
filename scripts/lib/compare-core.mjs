// compare primitive (design-comparison).
//
// One engine for both drift detection (saved vs live) and output verification
// (generated output vs saved). Produces per-category, thresholded deltas plus
// a quantified overall fidelity score (0..100) and pass/fail.

import { deltaE, isColor } from "./color.mjs";
import { normalizeTokenSet } from "./tokenset.mjs";

export const DEFAULT_THRESHOLDS = Object.freeze({
  colorDeltaE: 10, // RGB distance below which two colors are "the same"
  sizePx: 1, // px tolerance for numeric values (font size, spacing, radius)
  passScore: 85, // overall fidelity score (0..100) required to "pass"
});

// Default per-category weights for the overall fidelity score.
const WEIGHTS = Object.freeze({
  colors: 0.35,
  typography: 0.2,
  spacing: 0.15,
  radius: 0.1,
  shadows: 0.1,
  components: 0.1,
});

function parsePx(v) {
  if (v == null) return null;
  const m = String(v).match(/-?\d*\.?\d+/);
  return m ? parseFloat(m[0]) : null;
}

// Collapse whitespace + casing so semantically-equal CSS strings match.
function normalizeText(s) {
  return String(s).replace(/\s+/g, " ").trim().toLowerCase();
}

// Compare two flat string maps with an equality predicate. Only keys present
// in the reference are scored (we measure how well the candidate honors the
// reference; absent-in-reference candidate extras are not penalized).
function compareMap(refMap, candMap, eq) {
  const deltas = [];
  const keys = Object.keys(refMap);
  let matched = 0;
  for (const key of keys) {
    const reference = refMap[key];
    const candidate = candMap[key];
    if (candidate != null && eq(reference, candidate)) {
      matched += 1;
    } else {
      deltas.push({ token: key, reference, candidate: candidate ?? null });
    }
  }
  const score = keys.length === 0 ? null : Math.round((matched / keys.length) * 100);
  return { deltas, score, total: keys.length, matched };
}

function compareColors(ref, cand, t) {
  const refMap = {};
  const candMap = {};
  for (const [k, v] of Object.entries(ref.colors)) refMap[k] = v.value;
  for (const [k, v] of Object.entries(cand.colors)) candMap[k] = v.value;
  return compareMap(refMap, candMap, (a, b) => {
    if (isColor(a) && isColor(b)) return deltaE(a, b) < t.colorDeltaE;
    return String(a).toLowerCase() === String(b).toLowerCase();
  });
}

function compareNumericList(refValues, candValues, t) {
  // Match each reference value to the nearest candidate within tolerance.
  const refMap = {};
  refValues.forEach((v, i) => (refMap[`${v}#${i}`] = v));
  const candNums = candValues.map(parsePx).filter((n) => n != null);
  const deltas = [];
  let matched = 0;
  for (const [key, v] of Object.entries(refMap)) {
    const n = parsePx(v);
    const hit = n != null && candNums.some((c) => Math.abs(c - n) <= t.sizePx);
    if (hit) matched += 1;
    else deltas.push({ token: key.split("#")[0], reference: v, candidate: null });
  }
  const total = Object.keys(refMap).length;
  const score = total === 0 ? null : Math.round((matched / total) * 100);
  return { deltas, score, total, matched };
}

// Spacing = the base unit (scale type) plus the value scale. The base is
// compared too so a 4px↔8px grid shift is not silently missed.
function compareSpacing(ref, cand, t) {
  const result = compareNumericList(ref.spacing.values, cand.spacing.values, t);
  if (ref.spacing.base != null) {
    const baseMatch = cand.spacing.base != null && normalizeText(ref.spacing.base) === normalizeText(cand.spacing.base);
    result.total += 1;
    if (baseMatch) result.matched += 1;
    else result.deltas.push({ token: "base", reference: ref.spacing.base, candidate: cand.spacing.base ?? null });
    result.score = Math.round((result.matched / result.total) * 100);
  }
  return result;
}

function compareTypography(ref, cand, t) {
  const deltas = [];
  let parts = 0;
  let got = 0;

  // Font families: every reference family should appear in the candidate.
  const refFams = ref.typography.fontFamilies.map((f) => String(f).toLowerCase());
  const candFams = cand.typography.fontFamilies.map((f) => String(f).toLowerCase());
  for (const fam of refFams) {
    parts += 1;
    if (candFams.some((c) => c.includes(fam) || fam.includes(c))) got += 1;
    else deltas.push({ token: `fontFamily:${fam}`, reference: fam, candidate: null });
  }

  // Scale sizes by name.
  for (const [name, spec] of Object.entries(ref.typography.scale)) {
    const refSize = parsePx(spec?.size);
    if (refSize == null) continue;
    parts += 1;
    const candSize = parsePx(cand.typography.scale?.[name]?.size);
    if (candSize != null && Math.abs(candSize - refSize) <= t.sizePx) got += 1;
    else deltas.push({ token: `size:${name}`, reference: spec.size, candidate: cand.typography.scale?.[name]?.size ?? null });
  }

  const score = parts === 0 ? null : Math.round((got / parts) * 100);
  return { deltas, score, total: parts, matched: got };
}

function compareStringList(refList, candList) {
  const candSet = new Set(candList.map(normalizeText));
  const deltas = [];
  let matched = 0;
  for (const item of refList) {
    const norm = normalizeText(item);
    if (candSet.has(norm)) matched += 1;
    else deltas.push({ token: norm.slice(0, 40), reference: item, candidate: null });
  }
  const score = refList.length === 0 ? null : Math.round((matched / refList.length) * 100);
  return { deltas, score, total: refList.length, matched };
}

function compareComponents(ref, cand) {
  const refMap = {};
  const candMap = {};
  for (const [comp, props] of Object.entries(ref.components)) {
    for (const [prop, val] of Object.entries(props || {})) refMap[`${comp}.${prop}`] = String(val);
  }
  for (const [comp, props] of Object.entries(cand.components)) {
    for (const [prop, val] of Object.entries(props || {})) candMap[`${comp}.${prop}`] = String(val);
  }
  return compareMap(refMap, candMap, (a, b) => normalizeText(a) === normalizeText(b));
}

/**
 * Compare a candidate token set against a reference.
 * @param {object} reference
 * @param {object} candidate
 * @param {object} [opts] { thresholds }
 */
export function compareTokenSets(reference, candidate, opts = {}) {
  const t = { ...DEFAULT_THRESHOLDS, ...(opts.thresholds || {}) };
  const ref = normalizeTokenSet(reference);
  const cand = normalizeTokenSet(candidate);

  const categories = {
    colors: compareColors(ref, cand, t),
    typography: compareTypography(ref, cand, t),
    spacing: compareSpacing(ref, cand, t),
    radius: compareNumericList(ref.radius.values, cand.radius.values, t),
    shadows: compareStringList(ref.shadows, cand.shadows),
    components: compareComponents(ref, cand),
  };

  // Weighted overall score across categories that actually have reference data.
  let weightSum = 0;
  let acc = 0;
  for (const [name, result] of Object.entries(categories)) {
    if (result.score == null) continue; // category had no reference tokens
    const w = WEIGHTS[name] ?? 0;
    weightSum += w;
    acc += w * result.score;
  }
  const score = weightSum === 0 ? 100 : Math.round(acc / weightSum);
  const totalDeltas = Object.values(categories).reduce((n, c) => n + c.deltas.length, 0);

  return {
    score,
    pass: score >= t.passScore,
    thresholds: t,
    totalDeltas,
    match: totalDeltas === 0,
    categories,
  };
}
