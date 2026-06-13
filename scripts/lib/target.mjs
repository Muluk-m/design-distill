// Uniform target contract shared by extract + screenshot.
//
// A target is either a live URL (http/https) or a local artifact. Local
// artifacts may be passed as a `file://` URL or as a filesystem path; both
// resolve to a normalized `file://` URL so downstream code has one shape.

import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

/**
 * @param {string} raw
 * @returns {{ kind: "url" | "file", url: string, isLocal: boolean }}
 */
export function resolveTarget(raw) {
  if (raw == null || String(raw).trim() === "") {
    throw new Error("target is required");
  }
  const value = String(raw).trim();

  if (/^https?:\/\//i.test(value)) {
    return { kind: "url", url: value, isLocal: false };
  }
  if (/^file:\/\//i.test(value)) {
    return { kind: "file", url: value, isLocal: true };
  }
  // Treat anything else as a local filesystem path.
  const abs = resolve(value);
  return { kind: "file", url: pathToFileURL(abs).href, isLocal: true };
}

export function isUrl(raw) {
  return resolveTarget(raw).kind === "url";
}
