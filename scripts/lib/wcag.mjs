// accessibility-audit: WCAG 2.2 contrast ratios over the semantic palette.
// Records ratios + AA pass/fail; never mutates the source palette (D4).

import { toRgb, isColor } from "./color.mjs";

function relativeLuminance(hex) {
  const [r, g, b] = toRgb(hex).map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(hex1, hex2) {
  if (!isColor(hex1) || !isColor(hex2)) return null;
  const l1 = relativeLuminance(hex1);
  const l2 = relativeLuminance(hex2);
  const [hi, lo] = l1 >= l2 ? [l1, l2] : [l2, l1];
  return Math.round(((hi + 0.05) / (lo + 0.05)) * 100) / 100;
}

// AA thresholds: 4.5 for normal text, 3.0 for large text / UI components.
export const AA_NORMAL = 4.5;
export const AA_LARGE = 3.0;

/**
 * Audit the core text-on-surface pairs of a semantic role map.
 * @param {Record<string,string>} roles  e.g. { "color-text": "#...", "color-surface": "#..." }
 * @returns {{ pairs: Array<{name,fg,bg,ratio,threshold,pass}>, failures: number }}
 */
export function auditContrast(roles = {}) {
  const surface = roles["color-surface"];
  const pairs = [];
  const check = (name, fg, threshold) => {
    if (!fg || !surface) return;
    const ratio = contrastRatio(fg, surface);
    if (ratio == null) return;
    pairs.push({ name, fg, bg: surface, ratio, threshold, pass: ratio >= threshold });
  };
  check("text-on-surface", roles["color-text"], AA_NORMAL);
  check("text-secondary-on-surface", roles["color-text-secondary"], AA_NORMAL);
  // Primary used as a UI/button surface — treat as large/UI (3.0).
  check("primary-on-surface", roles["color-primary"], AA_LARGE);
  const failures = pairs.filter((p) => !p.pass).length;
  return { pairs, failures };
}
