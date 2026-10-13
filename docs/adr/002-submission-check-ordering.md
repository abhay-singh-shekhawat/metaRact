# ADR-002: Public submission check ordering

Date: 2026-10-13
Status: Accepted (supersedes architecture DSS-ARCH-001 v2.0 §6.5 step 2 ordering)

## Context

Section 6.5 lists submission-sequence step 2 as: size, origin, schema, service, URLs, honeypot, Turnstile, rate-limit. Implemented order in `POST /api/public/enquiries` is: size → origin → **rate-limit → honeypot (raw body) → schema → Turnstile**.

## Rationale

1. **Rate-limit before honeypot.** The honeypot short-circuit returns 201 without work; if it ran first, bot traffic would never consume rate-limit budget and could flood the endpoint unboundedly (each hit still costs JSON parse + Zod + a Turnstile round-trip otherwise). Rate limiting is the cheapest control and runs first.
2. **Honeypot on the raw body before schema validation.** Checking after validation leaks a 422-vs-201 oracle revealing the honeypot's existence. The raw `website` field is type-narrowed (`typeof === "string"`) before use; the validated use-case keeps its own honeypot check as defense-in-depth.

## Consequences

- Turnstile (network call) runs only for non-honeypot, schema-valid, rate-ok requests — minimal provider spend.
- Spec §6.5 should be read with this ordering at implementation.
