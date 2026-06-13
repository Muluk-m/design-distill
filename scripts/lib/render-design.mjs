// design-document renderer: structured token set (with semantic roles, essence,
// decisions) → DESIGN.md markdown view. The structured JSON is canonical; this
// view is always regenerated, never hand-edited as the source.

import { isDark } from "./color.mjs";

function section(title, body) {
  return body && body.trim() ? `## ${title}\n\n${body.trim()}\n` : "";
}

function rolesTable(roles) {
  const order = [
    "color-primary",
    "color-secondary",
    "color-surface",
    "color-surface-raised",
    "color-border",
    "color-text",
    "color-text-secondary",
    "color-error",
    "color-warning",
    "color-success",
  ];
  const rows = order.filter((r) => roles[r]).map((r) => `| \`${r}\` | \`${roles[r]}\` |`);
  if (!rows.length) return "";
  return `| Role | Value |\n|------|-------|\n${rows.join("\n")}`;
}

function rawPalette(colors) {
  const rows = Object.entries(colors).map(
    ([name, v]) => `- \`${v.value}\` — ${name}${v.confidence && v.confidence !== "unknown" ? ` (${v.confidence})` : ""}`
  );
  return rows.join("\n");
}

function typeScale(scale) {
  const rows = Object.entries(scale).map(([name, size]) => `| \`${name}\` | ${size} |`);
  if (!rows.length) return "";
  return `| Token | Size |\n|-------|------|\n${rows.join("\n")}`;
}

function components(comps) {
  return Object.entries(comps)
    .map(([name, props]) => {
      const lines = Object.entries(props).map(([k, v]) => `  ${k}: ${v};`);
      return `### ${name}\n\n\`\`\`css\n${lines.join("\n")}\n\`\`\``;
    })
    .join("\n\n");
}

function antiPatterns(normalized) {
  const out = [];
  const surface = normalized.semantic?.roles?.["color-surface"];
  if (surface) {
    out.push(isDark(surface) ? "Never use light/white backgrounds in the UI chrome." : "Never invert to a dark chrome — this is a light design.");
  }
  const shadowCount = (normalized.shadows || []).filter((s) => s && s !== "none").length;
  if (shadowCount === 0) out.push("Don't use box-shadows for elevation — use surface tiers / borders.");
  out.push("Don't introduce colors outside the documented palette.");
  return out.map((p) => `- ${p}`).join("\n");
}

/**
 * @param {object} normalized  output of normalizeSemantics + .essence
 * @param {object} [meta]      { name, source_url, distilled }
 */
export function renderDesignMd(normalized, meta = {}) {
  const name = meta.name || "Design System";
  const header = [
    `# ${name}`,
    "",
    meta.source_url ? `> source_url: ${meta.source_url}` : null,
    meta.distilled ? `> distilled: ${meta.distilled}` : null,
    "",
    "---",
    "",
  ]
    .filter((l) => l !== null)
    .join("\n");

  const roles = normalized.semantic?.roles || {};
  const surface = roles["color-surface"];
  const tone = surface ? `**Tone**: ${isDark(surface) ? "dark" : "light"} — surface \`${surface}\`` : "";

  const parts = [
    header,
    section("Essence", (normalized.essence || []).map((t) => `- ${t}`).join("\n")),
    section("Overview", tone),
    section("Semantic Colors", rolesTable(roles)),
    section("Palette (raw)", rawPalette(normalized.colors || {})),
    section("Typography", [
      (normalized.typography?.fontFamilies || []).length
        ? `Fonts: ${normalized.typography.fontFamilies.map((f) => `\`${f}\``).join(", ")}`
        : "",
      typeScale(normalized.semantic?.typeScale || {}),
    ]
      .filter(Boolean)
      .join("\n\n")),
    section("Spacing", normalized.semantic?.spacing?.base ? `Base unit: \`${normalized.semantic.spacing.base}\`` : ""),
    section(
      "Radius",
      Object.entries(normalized.semantic?.radius || {})
        .map(([k, v]) => `- \`${k}\`: ${v}`)
        .join("\n")
    ),
    section("Elevation", (normalized.shadows || []).length ? (normalized.shadows || []).map((s) => `- \`${s}\``).join("\n") : "Uses surface tiers / borders instead of shadows."),
    section("Components", components(normalized.components || {})),
    section(
      "Accessibility (WCAG 2.2 AA)",
      (normalized.accessibility?.pairs || [])
        .map((p) => `- ${p.pass ? "✅" : "⚠️"} \`${p.name}\` — ${p.ratio}:1 (needs ${p.threshold}:1)${p.pass ? "" : " — FAILS"}`)
        .join("\n")
    ),
    section(
      "Tech context",
      [
        normalized.meta?.framework ? `- Framework: ${normalized.meta.framework}` : null,
        normalized.meta?.iconSystem ? `- Icons: ${normalized.meta.iconSystem}` : null,
        (normalized.breakpoints || []).length ? `- Breakpoints: ${normalized.breakpoints.join(", ")}` : null,
        normalized.variants?.dark ? `- Dark variant: recorded (${Object.keys(normalized.variants.dark.colors || {}).length} colors)` : null,
      ]
        .filter(Boolean)
        .join("\n")
    ),
    section("Anti-patterns", antiPatterns(normalized)),
    section(
      "Normalization decisions",
      (normalized.decisions || []).map((d) => `- ${d}`).join("\n")
    ),
  ];

  return parts.filter(Boolean).join("\n") + "\n";
}
