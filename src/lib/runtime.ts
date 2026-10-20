/**
 * Runtime detection.
 *
 * The application runs in two places: plain Node.js (`next dev`, `next start`,
 * vitest, the operator scripts) and the Cloudflare Workers runtime (the
 * OpenNext build). A handful of behaviours differ between them — most
 * importantly the file-backed local store, which cannot persist on Workers —
 * so the check lives in one place.
 *
 * `navigator.userAgent` is the documented way to identify the Workers runtime;
 * Node.js reports `Node.js/<version>` there.
 */
export function isWorkersRuntime(): boolean {
  return typeof navigator !== "undefined" && navigator.userAgent === "Cloudflare-Workers";
}
