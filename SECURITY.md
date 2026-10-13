# Security

## Reporting a vulnerability

Email the studio security contact (to be published at launch). Include:
steps to reproduce, affected route/version, and impact. Do not publicly
disclose before a fix is available. Expect acknowledgement within two
business days.

## Secrets

- Never commit `.env.local` or real credentials. `.env.example` holds names only.
- Server-only keys (`SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_DB_URL`,
  `RESEND_API_KEY`, `TURNSTILE_SECRET_KEY`, `UPSTASH_REDIS_REST_TOKEN`) must
  never use `NEXT_PUBLIC_` or appear in client bundles, logs or screenshots.
- Rotate any exposed secret immediately in the provider dashboard and hosting
  secret manager, then invalidate old sessions/tokens.

## Access revocation

- Admin: set `admin_memberships.is_active=false` for the user and revoke their
  Supabase Auth session in the dashboard.
- If a device is lost: rotate `ADMIN_SESSION_SECRET` (dev) / Supabase keys as
  applicable and force re-login.

## Incident triage

1. Identify scope (routes, data, time window) via request IDs and provider logs —
   never log full enquiry bodies, emails, notes or tokens.
2. Contain: disable affected integration keys, block abusive IPs at the edge.
3. Preserve the enquiry store/database; notification failures never delete enquiries.
4. Notify affected individuals per legal advice; record timeline and remediation.

## Data deletion requests

Locate enquiries by reference number/email, verify requester identity
out-of-band, delete or anonymise the enquiry + related events/notes/outbox
rows, and confirm in writing. Default retention: delete/anonymise
unconverted/declined enquiries after 12 months of inactivity.

## Backups

- Production database: provider-scheduled backups + documented periodic logical
  export. Test-restore to a non-production environment before the first real
  enquiry and after major schema changes.
- Local file store (`.data/`) is not a backup; never use production data locally.
