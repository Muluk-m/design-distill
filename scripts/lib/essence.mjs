// Essence derivation (design-document): the <=5 traits that most define the
// look, giving generation a priority signal above the full token detail.

import { isDark } from "./color.mjs";

/**
 * @param {object} normalized  output of normalizeSemantics (has .semantic, .colors, .typography, .shadows)
 * @returns {string[]} at most 5 defining traits
 */
export function deriveEssence(normalized) {
  const traits = [];
  const roles = normalized.semantic?.roles || {};
  const surface = roles["color-surface"];
  const primary = roles["color-primary"];
  const fonts = normalized.typography?.fontFamilies || [];

  // 1. Tone — light vs dark, the single most defining (and most often-wrong) trait.
  if (surface) {
    traits.push(`${isDark(surface) ? "dark" : "light"} surface (${surface})`);
  }

  // 2. Primary/brand color.
  if (primary) traits.push(`brand accent ${primary}`);

  // 3. Primary typeface.
  if (fonts[0]) traits.push(`set in ${fonts[0]}`);

  // 4. Depth language — shadows vs flat/borders.
  const shadowCount = (normalized.shadows || []).filter((s) => s && s !== "none").length;
  traits.push(shadowCount === 0 ? "flat: depth via surfaces/borders, not shadows" : `${shadowCount} elevation shadow${shadowCount > 1 ? "s" : ""}`);

  // 5. Corner language — sharp vs rounded.
  const radius = normalized.semantic?.radius?.["radius-button"];
  if (radius) {
    const px = parseFloat(radius);
    traits.push(px <= 2 ? "near-sharp corners" : px >= 16 ? "pill/round corners" : `${px}px rounded corners`);
  }

  return traits.slice(0, 5);
}
