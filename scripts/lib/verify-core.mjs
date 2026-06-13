// visual-verification-loop: the bounded, convergent decision logic.
//
// The render→extract→compare measurement is done per round (by verify.mjs);
// this pure function decides whether to pass, iterate, or stop — so the loop is
// bounded (cap) and convergent (stops when a round doesn't improve). Kept pure
// for testability; the skill drives the actual regenerate-on-deltas loop.

export const DEFAULT_LOOP = Object.freeze({
  threshold: 85, // fidelity score required to pass
  cap: 3, // max iterations
  epsilon: 2, // min score improvement to count as "progress"
});

/**
 * @param {number[]} scores  fidelity score per round, in order (1+ entries)
 * @param {object} [opts] { threshold, cap, epsilon }
 * @returns {{ action: "pass"|"iterate"|"stop-cap"|"stop-converged", bestRound: number, bestScore: number }}
 */
export function decideOutcome(scores, opts = {}) {
  const o = { ...DEFAULT_LOOP, ...opts };
  if (!scores.length) return { action: "iterate", bestRound: -1, bestScore: -Infinity };

  let bestRound = 0;
  for (let i = 1; i < scores.length; i++) if (scores[i] > scores[bestRound]) bestRound = i;
  const bestScore = scores[bestRound];
  const last = scores[scores.length - 1];

  // Pass as soon as any round meets the threshold.
  if (bestScore >= o.threshold) return { action: "pass", bestRound, bestScore };

  // Stop if we've hit the iteration cap.
  if (scores.length >= o.cap) return { action: "stop-cap", bestRound, bestScore };

  // Convergence: the latest round did not improve meaningfully over the prior.
  if (scores.length >= 2) {
    const prev = scores[scores.length - 2];
    if (last - prev < o.epsilon) return { action: "stop-converged", bestRound, bestScore };
  }

  return { action: "iterate", bestRound, bestScore };
}

// Turn a compare report's per-category deltas into concrete, actionable fix
// instructions the regeneration step can act on.
export function deltasToInstructions(report) {
  const out = [];
  const cats = report.categories || {};
  for (const [cat, result] of Object.entries(cats)) {
    for (const d of result.deltas || []) {
      if (cat === "colors") {
        out.push(`Fix ${cat}: \`${d.token}\` should be ${d.reference}${d.candidate ? ` (got ${d.candidate})` : " (missing)"}.`);
      } else {
        out.push(`Fix ${cat}: ${d.token} should be ${d.reference}${d.candidate ? ` (got ${d.candidate})` : " (missing)"}.`);
      }
    }
  }
  return out;
}
