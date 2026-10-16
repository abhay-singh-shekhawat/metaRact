import type { Metadata } from "next";
import { ButtonLink, Eyebrow, PageHero, Section } from "@/components/ui/primitives";
import { ProcessRail } from "@/components/motion/ProcessRail";
import { Reveal } from "@/components/motion/Reveal";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = { title: "Process", description: "From enquiry to handover: brief, scope, quote, build, review, handover." };

const steps: [string, string][] = [
  ["1 · Brief", "You submit the project form — outcome, audience, what done looks like, contact details. Reference URLs welcome; please don't send passwords, keys, or sensitive data."],
  ["2 · First review", "We read every brief by hand, check feasibility and fit, and reply from your contact details. If we're not the right team, we say so early."],
  ["3 · Scope in writing", "Deliverables, exclusions, assumptions, revision allowance, and handover contents — agreed before any build starts."],
  ["4 · Human quote", "Price and timeline follow the scope. Third-party costs (domains, hosting, licences, API usage) are listed separately."],
  ["5 · Build & review", "Work proceeds in reviewable slices with explicit check-ins. You see progress; changes to scope get a separate written note."],
  ["6 · Handover", "Source code, design files, or exports plus setup notes — whatever the quote promised. Support beyond that is a new agreement."],
];

export default function ProcessPage() {
  return (
    <>
      <PageHero
        eyebrow={<Eyebrow>Process</Eyebrow>}
        folio="DOC 03 / PROCESS"
        title="A short process, written down"
        lead="Brief, scope, quote, build, handover. Every step produces something you can read — nothing runs on vibes."
        meta={[
          { k: "Steps", v: "Six, each written down" },
          { k: "First review", v: "By hand, every brief" },
          { k: "Scope", v: "Agreed before any build" },
          { k: "Third-party costs", v: "Listed separately" },
          { k: "Revisions", v: "Stated in each quote" },
        ]}
        cta={<ButtonLink href="/start-project">{siteConfig.primaryCta}</ButtonLink>}
      />

      {/* ── The rail is the page: sequence, not a grid of six cards ───────── */}
      <Section tone="plain">
        <div className="container-studio">
          <ProcessRail steps={steps} />
        </div>
      </Section>

      {/* ── Closing note: how change requests are handled ─────────────────── */}
      <Section tone="surface">
        <div className="container-studio">
          <Reveal>
            <div className="grid gap-5 md:grid-cols-[0.9fr_1.1fr] md:gap-16">
              <h2 className="display-h2 text-[24px] text-balance">
                Revisions &amp; change requests
              </h2>
              <p className="max-w-[62ch] text-[15px] leading-relaxed text-[var(--ink-2)]">
                Each quote states its revision allowance. Extra rounds or scope changes are quoted
                separately before work continues — no surprise invoices.
              </p>
            </div>
          </Reveal>
        </div>
      </Section>
    </>
  );
}
