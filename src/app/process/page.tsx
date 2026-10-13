import type { Metadata } from "next";
import { PageHero, Card, ButtonLink } from "@/components/ui/primitives";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = { title: "Process", description: "From enquiry to handover: brief, scope, quote, build, review, handover." };

const steps = [
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
      <PageHero title="A short process, written down" lead="Brief, scope, quote, build, handover. Every step produces something you can read — nothing runs on vibes." cta={<ButtonLink href="/start-project">{siteConfig.primaryCta}</ButtonLink>} />
      <div className="container-studio grid gap-5 py-12 lg:grid-cols-2">
        {steps.map(([t, d]) => (
          <Card key={t}>
            <h2 className="text-[16.5px] font-semibold">{t}</h2>
            <p className="mt-2 text-[14.5px] leading-relaxed text-[#596273]">{d}</p>
          </Card>
        ))}
      </div>
      <div className="container-studio pb-16">
        <Card>
          <h2 className="text-[17px] font-semibold">Revisions & change requests</h2>
          <p className="mt-2 text-[14.5px] text-[#596273]">Each quote states its revision allowance. Extra rounds or scope changes are quoted separately before work continues — no surprise invoices.</p>
        </Card>
      </div>
    </>
  );
}
