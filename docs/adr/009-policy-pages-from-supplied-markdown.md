# ADR-009: Policy pages are generated from operator-supplied markdown

Date: 2026-10-18
Status: Accepted

## Context

The four policy pages (`/privacy`, `/terms`, `/cancellation`, `/intellectual-property`) carried
short summaries written in-house while the real documents were outstanding. On 2026-10-18 the
operator supplied finished policies: four markdown files, 56 numbered sections, naming the
business **Metaract**.

Three questions had to be answered before any of it could be published.

1. **Where do the words live?** Options were: a markdown parser (a new dependency, and a
   parser bug silently mangles legal text), hand-transcription into JSX (40 KB by hand, with
   typos that nobody would catch), or a small generator from markdown to typed modules.
2. **How does anything stay true?** Legal text is the one part of this codebase where a
   silent edit is a defect with consequences. "We were careful" is not a control.
3. **What about the passages addressed to the operator?** Several sentences are instructions
   to the business rather than statements to a visitor — e.g. *"The accepted quote must
   expressly state how a cancellation at exactly 25% elapsed time is handled"* — and
   Cancellation §9 contained a broken sentence with a stray lower-case "within".

Separately, the supplied documents name the business, which the site had been holding as a
placeholder ("Your Studio Name") precisely because it was the operator's to supply (ADR-003).

## Decision

**Markdown in `docs/legal/`, one generator, one renderer, one gate.**

- `docs/legal/*.md` is the source of truth, and the only place a policy is ever edited.
- `pnpm legal:import` (`scripts/import-legal.ts` + `scripts/lib/legal-import.ts`) converts it
  into typed modules in `src/content/legal/`, which are marked `GENERATED — do not edit by
  hand`. The generator accepts a deliberately small markdown subset (one `# ` title, numbered
  `## N. ` sections, paragraphs, `- ` lists, `1. ` lists, `**bold**`, two-space hard breaks)
  and **fails rather than guesses** on anything else — a link, a table or an italic in a
  future revision stops the import and gets handled on purpose.
- `src/components/marketing/LegalPage.tsx` renders it. The only two transformations are
  `**bold**` → emphasis and a mention of another policy's exact title → a link, both
  implemented as pure lossless splitters in `src/content/legal/inline.ts`.
- `tests/unit/legal-content.test.ts` rebuilds the markdown from the published modules and
  compares it to `docs/legal/*.md`. One parser and one inverse, so there is no second
  implementation to drift. It also asserts, for every published string, that joining the
  inline segments reproduces the source character for character — the promise that the
  renderer cannot alter wording now has a test behind it.
- **The seven edits are data, not drift.** Each is recorded with before/after in
  `docs/legal/DEVIATIONS.md`, and the test asserts both directions: the removed wording is
  absent, and the commitments it carried are still published. Where a sentence was an
  instruction to the operator, it became the operator's own commitment in the first person
  the documents already use ("We state this rule in the quote before you accept it."), so no
  client-facing obligation was dropped to fix a tone problem.
- **The name is configured, not templated.** `src/config/site.ts` now defaults
  `studioName` to `Metaract` and keeps failing closed on a placeholder
  (`PLACEHOLDER_STUDIO_NAMES`), so the preflight gate changed from "set this env var" to
  "never deploy a placeholder". `scripts/check-production-config.ts` imports the resolution
  rule instead of duplicating it.
- **One version string, and it is not an env var.** `src/config/legal.ts` holds
  `version`/`updated`; `privacyNoticeVersion` reads from it. Previously the value came from
  `PRIVACY_NOTICE_VERSION`, which a **client** component also displayed — and a
  non-`NEXT_PUBLIC_` env var is invisible to client bundles, so the form could have shown a
  different version from the one the server recorded against the enquiry. The env var is
  gone rather than documented.

## Consequences

- Revising a policy is: edit the markdown → `pnpm legal:import` → bump `legalConfig` →
  `pnpm test`. The published modules are never edited directly; the import overwrites them
  and the test compares against the markdown, so a hand edit cannot survive.
- The service descriptions on the marketing pages and the service list inside the policies
  are separate statements. The Terms call out "six service areas" (splitting custom software
  from applications) while `enabledServices()` currently returns five — flagged to the
  operator rather than silently reconciled, because wording in a legal document is not the
  app's to change.
- Persisted field names kept their original spelling (`privacyNoticeAcknowledged`,
  `privacyNoticeVersion`) while the user-facing copy now says "Privacy Policy". Renaming a
  field written into every enquiry was not worth the migration; the divergence is documented
  here rather than left as a surprise.
- Printing is a first-class use of these pages: `@media print` hides the site chrome, the
  contents rail and the cross-link blocks, and keeps a heading with the text it introduces.
- Nothing in `src/content/legal/` is imported by a client component, so the ±45 KB of policy
  text stays on the server and never enters a client bundle.
- The deleted `PolicyShell`/`policyLayout` helpers are replaced by `LegalPage`; the four pages
  are now ~15 lines each and contain no wording at all.
