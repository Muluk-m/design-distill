// Tiny argv helpers shared by the CLI wrapper scripts.

/** Value following a `--flag`, or `fallback` if absent. */
export function flagValue(args, name, fallback = null) {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
}

/**
 * All bare positional arguments — tokens that are neither a `--flag` nor the
 * value consumed by a preceding value-taking flag.
 */
export function positionals(args, flagsWithValue = []) {
  const valueFlags = new Set(flagsWithValue);
  const out = [];
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith("--")) continue;
    if (i > 0 && valueFlags.has(args[i - 1])) continue;
    out.push(args[i]);
  }
  return out;
}

/** First bare positional argument (see {@link positionals}). */
export function positional(args, flagsWithValue = []) {
  return positionals(args, flagsWithValue)[0];
}
