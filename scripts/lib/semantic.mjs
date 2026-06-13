// semantic-normalization: map a raw token set to a fixed set of semantic roles
// using deterministic, documented decision rules. Layered ON TOP of the raw
// token set (D3) — raw values are retained; this adds a `semantic` block and a
// `decisions` log so every assignment/override is inspectable.

import { normalizeTokenSet } from "./tokenset.mjs";
import { hueFamily, saturation, rgbToHsl, isColor, isOpaque } from "./color.mjs";
import { contrastRatio } from "./wcag.mjs";

const MODULAR_BASE = 16;
const MODULAR_RATIO = 1.25;
const CONFIDENCE_RANK = { high: 3, medium: 2, low: 1, unknown: 0 };

function parsePx(v) {
  if (v == null) return null;
  const m = String(v).match(/-?\d*\.?\d+/);
  return m ? parseFloat(m[0]) : null;
}

// Nearest step of the modular scale (base 16, ratio 1.25), rounded to integer px.
export function nearestModularStep(size) {
  if (size == null) return null;
  let best = MODULAR_BASE;
  let bestErr = Infinity;
  for (let n = -2; n <= 8; n++) {
    const step = MODULAR_BASE * MODULAR_RATIO ** n;
    const err = Math.abs(step - size);
    if (err < bestErr) {
      bestErr = err;
      best = step;
    }
  }
  return Math.round(best);
}

function colorEntries(ts) {
  return Object.entries(ts.colors)
    // Skip near-transparent colors (e.g. rgba(...,0)) — overlays, not roles.
    .filter(([, v]) => isOpaque(v.value, 0.4))
    .map(([name, v]) => ({
    name,
    value: v.value,
    confidence: v.confidence || "unknown",
    family: hueFamily(v.value),
    sat: saturation(v.value),
    l: isColor(v.value) ? rgbToHsl(v.value).l : 0.5,
  }));
}

function assignNeutrals(neutrals, decisions) {
  const roles = {};
  if (neutrals.length === 0) return roles;
  const byL = [...neutrals].sort((a, b) => a.l - b.l);
  const darkest = byL[0];
  const lightest = byL[byL.length - 1];
  // Tone: if the average neutral is dark, it is a dark theme (surface = darkest).
  const avgL = byL.reduce((s, c) => s + c.l, 0) / byL.length;
  const dark = avgL < 0.5;

  const surface = dark ? darkest : lightest;
  const text = dark ? lightest : darkest;
  roles["color-surface"] = surface.value;
  roles["color-text"] = text.value;
  decisions.push(`color-surface = ${surface.value} (${dark ? "darkest" : "lightest"} neutral; ${dark ? "dark" : "light"} theme)`);
  decisions.push(`color-text = ${text.value} (opposite-extreme neutral)`);

  // Secondary text + surface-raised + border from remaining mid neutrals.
  const mids = byL.filter((c) => c !== surface && c !== text);
  if (mids.length) {
    const secondary = mids[Math.floor(mids.length / 2)];
    roles["color-text-secondary"] = secondary.value;
    decisions.push(`color-text-secondary = ${secondary.value} (mid neutral)`);
  }
  // surface-raised: neutral one step toward text from surface.
  const raisedPool = dark ? byL.slice(1) : byL.slice(0, -1);
  const raised = raisedPool.find((c) => c !== surface);
  if (raised) {
    roles["color-surface-raised"] = raised.value;
    decisions.push(`color-surface-raised = ${raised.value} (neutral adjacent to surface)`);
  }
  if (mids.length) {
    const border = dark ? mids[0] : mids[mids.length - 1];
    roles["color-border"] = border.value;
    decisions.push(`color-border = ${border.value} (low-contrast neutral)`);
  }
  return roles;
}

function pickPrimary(chromatic, ts, decisions) {
  if (chromatic.length === 0) return null;
  const buttonBg = ts.components?.button?.background;
  // Rank: confidence desc, then matches button background, then saturation desc.
  const ranked = [...chromatic].sort((a, b) => {
    const c = CONFIDENCE_RANK[b.confidence] - CONFIDENCE_RANK[a.confidence];
    if (c !== 0) return c;
    const am = buttonBg && a.value.toLowerCase() === String(buttonBg).toLowerCase() ? 1 : 0;
    const bm = buttonBg && b.value.toLowerCase() === String(buttonBg).toLowerCase() ? 1 : 0;
    if (am !== bm) return bm - am;
    return b.sat - a.sat;
  });
  const primary = ranked[0];
  const competing = chromatic.filter((c) => CONFIDENCE_RANK[c.confidence] >= CONFIDENCE_RANK[primary.confidence] - 0).length;
  decisions.push(
    `color-primary = ${primary.value} (${primary.confidence} confidence` +
      (buttonBg ? `, button-bg ${primary.value.toLowerCase() === String(buttonBg).toLowerCase() ? "match" : "no-match"}` : "") +
      (competing > 1 ? `; ${competing} candidates, broke tie by interactive-usage then saturation` : "") +
      ")"
  );
  return primary;
}

/**
 * @param {object} rawTokenSet
 * @returns {object} tokenset with an added `semantic` block and `decisions[]`
 */
export function normalizeSemantics(rawTokenSet) {
  const ts = normalizeTokenSet(rawTokenSet);
  const decisions = [];
  const all = colorEntries(ts);
  const neutrals = all.filter((c) => c.family === "neutral" || c.sat < 0.18);
  const chromatic = all.filter((c) => !neutrals.includes(c));

  const roles = { ...assignNeutrals(neutrals, decisions) };

  const primary = pickPrimary(chromatic, ts, decisions);
  if (primary) roles["color-primary"] = primary.value;
  const rest = chromatic.filter((c) => c !== primary);
  if (rest.length) {
    const secondary = [...rest].sort((a, b) => CONFIDENCE_RANK[b.confidence] - CONFIDENCE_RANK[a.confidence] || b.sat - a.sat)[0];
    roles["color-secondary"] = secondary.value;
    decisions.push(`color-secondary = ${secondary.value}`);
  }

  // Status colors with reserved hues.
  const primaryFamily = primary ? primary.family : null;
  const error = chromatic.find((c) => c.family === "red");
  if (error) {
    roles["color-error"] = error.value;
    decisions.push(`color-error = ${error.value} (red hue, reserved for errors)`);
  }
  const amber = chromatic.find((c) => (c.family === "orange" || c.family === "yellow") && c.value !== primary?.value);
  if (amber && amber.family === primaryFamily && amber.value === primary?.value) {
    decisions.push("color-warning unset: brand is orange and no distinct amber found (orange cannot double as warning)");
  } else if (amber) {
    roles["color-warning"] = amber.value;
    decisions.push(`color-warning = ${amber.value} (distinct amber, reserved for warnings)`);
  } else if (primaryFamily === "orange") {
    decisions.push("color-warning unset: brand is orange and no distinct amber found (orange cannot double as warning)");
  }
  const success = chromatic.find((c) => c.family === "green");
  if (success) {
    roles["color-success"] = success.value;
    decisions.push(`color-success = ${success.value} (green hue, reserved for success)`);
  }

  // Type scale: ensure a body size, floor at 16px, round to modular steps.
  const typeScale = {};
  const scaleEntries = Object.entries(ts.typography.scale);
  let bodyPx = null;
  for (const [name, spec] of scaleEntries) {
    const px = parsePx(spec?.size);
    if (px == null) continue;
    if (/body|base|text/i.test(name)) bodyPx = bodyPx == null ? px : Math.min(bodyPx, px);
  }
  if (bodyPx == null && scaleEntries.length) {
    // Fall back to the smallest size as body.
    bodyPx = Math.min(...scaleEntries.map(([, s]) => parsePx(s?.size)).filter((n) => n != null));
  }
  if (bodyPx != null && bodyPx < 16) {
    decisions.push(`text-base floored to 16px (extracted body was ${bodyPx}px)`);
    bodyPx = 16;
  }
  if (bodyPx != null) typeScale["text-base"] = `${bodyPx}px`;
  for (const [name, spec] of scaleEntries) {
    const px = parsePx(spec?.size);
    if (px == null) continue;
    const stepped = nearestModularStep(Math.max(px, name === "text-base" ? 16 : 0));
    typeScale[name] = `${stepped}px`;
    if (stepped !== px) decisions.push(`${name} ${px}px → ${stepped}px (modular scale base ${MODULAR_BASE}, ratio ${MODULAR_RATIO})`);
  }

  // Spacing base + radius roles.
  const spacing = {};
  const spacingNums = ts.spacing.values.map(parsePx).filter((n) => n != null).sort((a, b) => a - b);
  const base = parsePx(ts.spacing.base) || spacingNums[0] || null;
  if (base != null) {
    spacing.base = `${base}px`;
    decisions.push(`spacing base = ${base}px`);
  }
  const radius = {};
  const radiusNums = ts.radius.values.map(parsePx).filter((n) => n != null).sort((a, b) => a - b);
  if (radiusNums.length) {
    radius["radius-button"] = `${radiusNums[0]}px`;
    radius["radius-card"] = `${radiusNums[radiusNums.length > 1 ? 1 : 0]}px`;
    decisions.push(`radius-button = ${radius["radius-button"]}, radius-card = ${radius["radius-card"]}`);
  }

  // Guard: text must actually contrast the surface. If the neutral-based pick
  // collided with the surface (common on sparse auto-palettes), choose the
  // opaque color with the highest contrast against the surface instead.
  const surfaceVal = roles["color-surface"];
  if (surfaceVal) {
    const textVal = roles["color-text"];
    const ratio = textVal ? contrastRatio(textVal, surfaceVal) : null;
    if (!textVal || (ratio != null && ratio < 3)) {
      let best = null;
      let bestRatio = ratio || 0;
      for (const c of all) {
        if (c.value === surfaceVal) continue;
        const r = contrastRatio(c.value, surfaceVal);
        if (r != null && r > bestRatio) {
          bestRatio = r;
          best = c.value;
        }
      }
      if (best) {
        roles["color-text"] = best;
        decisions.push(`color-text = ${best} (re-picked for contrast ${Math.round(bestRatio * 10) / 10}:1 against surface)`);
      }
    }
  }

  ts.semantic = { roles, typeScale, spacing, radius };
  ts.decisions = decisions;
  return ts;
}
