# Edits applied to the supplied policies

The four documents were supplied on 18 October 2026 and published verbatim, with the seven
edits below. Each one is a sentence that was addressed to the **operator** rather than to a
reader, a word that framed the terms as something the operator had asked for, or a broken
sentence. No obligation, exclusion, right or limitation was weakened, added or removed —
where a sentence carried a commitment to the client, that commitment is still published, in
the first person the documents already use ("we will…", "we state…").

Nothing else in the text was touched. `tests/unit/legal-content.test.ts` asserts both
directions: the removed wording is absent, and the commitments it carried are present.

---

## 1 — Cancellation and Refund Policy, §3: internal instruction removed

**Before**

> The quote should record the start date and target completion date so this calculation is clear. **Your stated rule distinguishes cancellations before 25% from cancellations after 25%. The accepted quote must expressly state how a cancellation at exactly 25% elapsed time is handled, so this boundary is agreed before the project begins.**

**After**

> The quote should record the start date and target completion date so this calculation is clear.

**Why:** written to the operator about a boundary to be agreed internally. The boundary is
already covered by the published text — §4 applies to cancellations "at or after 25%", so
the exactly-25% case has a rule and no gap is left.

---

## 2 — Cancellation and Refund Policy, §3: "requested" removed

**Before:** `Metaract’s requested standard rule is to deduct 25% of the advance payment actually received…`

**After:** `Metaract’s standard rule is to deduct 25% of the advance payment actually received…`

**Why:** "requested" reads as a client instruction being quoted back. The published term is
the policy, so it is stated as one. The rule itself — 25% of the advance actually received,
not of the project price, with the worked example — is unchanged.

---

## 3 — Cancellation and Refund Policy, §4: "requested" removed

**Before:** `Metaract’s requested standard rule is that the advance payment is non-refundable…`

**After:** `Metaract’s standard rule is that the advance payment is non-refundable…`

**Why:** as above. Every qualification is preserved: applicable law, mandatory consumer
rights, the circumstances of the cancellation, and any different lawful written term.

---

## 4 — Cancellation and Refund Policy, §4: disclosure obligation restated to the reader

**Before:** `This rule must be clearly shown in the quote before acceptance.`

**After:** `We state this rule in the quote before you accept it.`

**Why:** the original was an instruction about what a future quote must contain. The
obligation behind it — the client is told this before accepting — is kept, now as the
operator's own commitment.

---

## 5 — Cancellation and Refund Policy, §9: broken sentence repaired

**Before**

> …approved refunds will be initiated within the period stated in the accepted quote or communicated in writing for the cancellation. **within** a reasonable period after the refund amount is confirmed to the original payment method where possible.

**After**

> …approved refunds will be initiated within the period stated in the accepted quote or communicated in writing for the cancellation, **and otherwise** within a reasonable period after the refund amount is confirmed, to the original payment method where possible.

**Why:** the second sentence was a fragment — a stray lower-case "within" with no subject.
Both timing sources are preserved (a period stated in the quote, or otherwise a reasonable
period after confirmation), as is the original-payment-method preference.

---

## 6 — Terms of Service, §4: launch to-do replaced by the disclosure it promised

**Before**

> **The actual messaging platform, payment provider, invoice/tax setup and secure payment-link verification process remain to be confirmed before launch and must be disclosed where required.**

**After**

> **The messaging platform, payment provider, invoice and tax setup, and the secure payment-link verification process will be disclosed where required.**

**Why:** the original was an internal launch checklist item. The client-facing commitment —
these details are disclosed where the law requires it — is kept, without publishing a
to-do list.

---

## 7 — Privacy Policy, §11: cookies note stated as a commitment

**Before**

> **The final notice and any consent controls should match the cookies and tracking tools actually enabled on the website.**

**After**

> **We keep this notice and any consent controls consistent with the cookies and tracking tools enabled on the website.**

**Why:** an instruction to the operator about finishing the notice. The duty to keep the
notice truthful is preserved and restated as the operator's commitment.

---

## Reviewed and deliberately left alone

These read as instructions but are addressed at **both parties** or state how the written
agreement will work. Standard drafting of this kind was left exactly as supplied:

- "The project agreement should state what we will deliver, in which formats, what is excluded…" (Terms §3)
- "The agreement should state who owns each third-party account, who pays recurring charges…" (Terms §4)
- "The SOW should define the intended behaviour, data permitted for use, evaluation method…" (Terms §9)
- "The SOW should specify which AI artefacts are deliverables…" (IP §6)
- "The SOW should specify the permitted purpose, territory, duration, exclusivity…" (IP §4)
- "…may vary and should be identified in the transaction information or applicable notice where required by law." (Privacy §3)
- "Any restart fee or inactivity charge must be disclosed in the accepted project agreement or agreed in writing before it is charged." (Cancellation §8)

If any of these should also be tightened, they are one markdown edit plus `pnpm legal:import`
away.
