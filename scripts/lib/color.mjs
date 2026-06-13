// Color utilities for the compare primitive. Ported from src/lib/color.ts so
// the bundled scripts have no build-step dependency on the TS sources.

// Parse a CSS color (hex #rgb/#rrggbb or rgb()/rgba()) to [r,g,b], or null.
export function parseColor(value) {
  if (typeof value !== "string") return null;
  const v = value.trim();
  const rgb = v.match(/^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/i);
  if (rgb) return [Math.round(+rgb[1]), Math.round(+rgb[2]), Math.round(+rgb[3])];
  const h = v.replace("#", "");
  if (/^[0-9a-f]{3}$/i.test(h)) return [h[0] + h[0], h[1] + h[1], h[2] + h[2]].map((x) => parseInt(x, 16));
  if (/^[0-9a-f]{6}$/i.test(h)) return [h.slice(0, 2), h.slice(2, 4), h.slice(4, 6)].map((x) => parseInt(x, 16));
  return null;
}

// Backward-compatible: returns [r,g,b] (NaNs on bad input, matching old behavior).
export function toRgb(hex) {
  const parsed = parseColor(hex);
  return parsed || [NaN, NaN, NaN];
}

// Any parseable CSS color (hex or rgb/rgba).
export function isColor(value) {
  return parseColor(value) !== null;
}

// Alpha channel of a color (1 for hex / rgb without alpha).
export function alphaOf(value) {
  if (typeof value !== "string") return 1;
  const m = value.trim().match(/^rgba\(\s*[\d.]+[,\s]+[\d.]+[,\s]+[\d.]+[,\s/]+([\d.]+)\s*\)/i);
  return m ? parseFloat(m[1]) : 1;
}

// A color that is opaque enough to carry a role (not a near-transparent overlay).
export function isOpaque(value, min = 0.5) {
  return isColor(value) && alphaOf(value) >= min;
}

// Strictly a hex color (kept for callers that specifically need hex).
export function isHex(value) {
  return typeof value === "string" && /^#?[0-9a-f]{3}([0-9a-f]{3})?$/i.test(value.trim());
}

export function isDark(hex) {
  const [r, g, b] = toRgb(hex);
  return (r * 299 + g * 587 + b * 114) / 1000 < 128;
}

export function rgbToHsl(hex) {
  let [r, g, b] = toRgb(hex);
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      default:
        h = (r - g) / d + 4;
    }
    h *= 60;
  }
  return { h, s, l };
}

// Coarse hue family used by semantic-normalization to reserve status colors.
export function hueFamily(hex) {
  if (!isColor(hex)) return "unknown";
  const { h, s, l } = rgbToHsl(hex);
  if (s < 0.15 || l < 0.06 || l > 0.96) return "neutral";
  if (h < 15 || h >= 345) return "red";
  if (h < 45) return "orange";
  if (h < 70) return "yellow";
  if (h < 165) return "green";
  if (h < 200) return "teal";
  if (h < 255) return "blue";
  if (h < 290) return "indigo";
  return "magenta";
}

export function saturation(hex) {
  return isColor(hex) ? rgbToHsl(hex).s : 0;
}

// Euclidean RGB distance — a cheap perceptual-ish color distance, matching the
// legacy `diff` command's deltaE so behavior is consistent.
export function deltaE(hex1, hex2) {
  try {
    const [r1, g1, b1] = toRgb(hex1);
    const [r2, g2, b2] = toRgb(hex2);
    if ([r1, g1, b1, r2, g2, b2].some((n) => Number.isNaN(n))) return Infinity;
    return Math.sqrt((r2 - r1) ** 2 + (g2 - g1) ** 2 + (b2 - b1) ** 2);
  } catch {
    return Infinity;
  }
}
