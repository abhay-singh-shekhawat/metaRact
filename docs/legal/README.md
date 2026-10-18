# Published policy text

The four policy pages are not written in the app. The supplied documents are the source
of truth, kept here, and the site renders them verbatim.

| Document | Route | Sections |
| --- | --- | --- |
| `privacy-policy.md` | `/privacy` | 16 |
| `terms-of-service.md` | `/terms` | 19 |
| `cancellation-refund-policy.md` | `/cancellation` | 11 |
| `intellectual-property-policy.md` | `/intellectual-property` | 10 |

Supplied by the operator on 18 October 2026; the delivered files are archived outside the
repository at `D:\TEMP\opencode\legal-supplied-originals-20261018`. Seven edits were applied
before publication and are recorded one by one in [DEVIATIONS.md](./DEVIATIONS.md).

## How the text reaches the page

```
docs/legal/<file>.md              the published text (this folder)
        │  pnpm legal:import
        ▼
src/content/legal/<file>.ts       typed modules the pages render, marked GENERATED
        │
        ▼
src/components/marketing/LegalPage.tsx    the shared policy layout
```

`pnpm legal:import` converts the markdown into blocks the app can render without a
markdown parser and without adding a dependency. It accepts a deliberately small subset —
one `# ` title, numbered `## N. ` sections, paragraphs, `- ` lists, `1. ` lists, `**bold**`
spans and two-trailing-space hard breaks — and **refuses to write anything** if a document
uses anything else, rather than guessing. So a new markdown feature (a link, a table, an
italic) fails the import loudly and gets handled deliberately.

## Revising a policy

1. Edit `docs/legal/<file>.md`.
2. `pnpm legal:import`.
3. Review the diff in `src/content/legal/` — it should contain exactly your edit.
4. Bump `legalConfig` in `src/config/legal.ts` (version, date). The version is recorded
   against every new enquiry, so bumping it is what tells you later which text a client
   acknowledged.
5. `pnpm test` — `tests/unit/legal-content.test.ts` proves the published modules are a
   character-for-character transcription of the markdown, so any drift fails CI.

Editing `src/content/legal/*.ts` by hand does not survive step 5: the next import
overwrites it and the test compares against the markdown. Change the markdown instead.

## Rules this folder exists to enforce

- **No paraphrase.** The site never summarises, merges or reflows a sentence. Bold and
  cross-links to the other policies are the only transformations, and both are proven
  character-preserving by the unit tests.
- **No invented business facts.** The documents deliberately leave the contracting entity,
  registered details, payment provider and grievance route to the project agreement. The
  pages do not fill those gaps with guesses, and no address, registration number or contact
  detail has been added.
- **No unfinished notes on a public page.** Anything addressed to the operator rather than
  to a visitor is an edit, recorded in `DEVIATIONS.md`, not a sentence left to ship.
