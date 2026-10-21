/**
 * Resolve the public Turnstile site key at request time.
 *
 * Next.js replaces literal `process.env.NEXT_PUBLIC_*` references with the value
 * that existed during `next build`. That is why a key configured only in the
 * Cloudflare runtime dashboard used to disappear from the deployed page: the
 * client bundle contained an empty string, so EnquiryForm never rendered the
 * widget or loaded the script.
 *
 * The bracket lookup below is deliberate. It is not rewritten by Next's build
 * define plugin, and OpenNext populates `process.env` from the Worker's runtime
 * variables before rendering. The direct lookup remains as the normal build-time
 * (and `next dev`) fallback. This value is public by design; the secret key is
 * only ever read by the server-side Siteverify call.
 */
export function getTurnstileSiteKey(): string {
  // Read through an indirection: a literal `process.env.NEXT_PUBLIC_*` access is
  // replaced by Next at build time, while `process.env[name]` is not.
  const runtime = typeof process === "undefined" ? undefined : process.env["NEXT_PUBLIC_TURNSTILE_SITE_KEY"];
  const buildTime = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  return (runtime || buildTime || "").trim();
}
