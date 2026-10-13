# ADR-001: Primary CTA wording — "Describe your project"

Date: 2026-10-13
Status: Accepted (supersedes architecture DSS-ARCH-001 v2.0 §§4.3, 5.2 on CTA copy)

## Context

The architecture specifies a **Start a Project** primary button in navigation (§4.3) and hero (§5.2). An independent design critique (`.impeccable/critique/`, personas Jordan/Riley) found "Start a Project" sounds committal for a first click whose actual action is sending a no-account plain-language brief, and that three same-destination labels ("Start a Project" / "Describe your project" / "Request an estimate") dilute scent.

## Decision

The single primary CTA label is **"Describe your project"**, centralized on `siteConfig.primaryCta` and consumed by nav, hero, cards, footers, and page CTAs. Service/work detail variants keep specific labels ("Start a {title} enquiry"). The `/start-project` route path and page title are unchanged (URLs stable).

## Consequences

- Next implementer must not "fix" the label back to the spec's literal text; this ADR wins.
- If analytics later shows weaker click-through, revisit with measured data.
