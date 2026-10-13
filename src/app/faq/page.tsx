import type { Metadata } from "next";
import { PageHero, ButtonLink } from "@/components/ui/primitives";

export const metadata: Metadata = { title: "FAQ", description: "Scope, estimates, timelines, revisions, handoff, and costs." };

const groups: [string, [string, string][]][] = [
  ["Scope & fit", [
    ["What do you actually deliver?", "Whatever the written scope says: pages, flows, screens, assets, integrations, and handover contents. If it isn't written, it isn't included."],
    ["Do you take every enquiry?", "No. We decline work outside our capability or capacity — early and plainly."],
    ["Can one project span services?", "Yes. Pick the closest service in the form and explain the rest in your summary."],
  ]],
  ["Estimates & timelines", [
    ["When do I get a price?", "After we confirm scope and feasibility. Budget bands in the form are planning signals, never a quote."],
    ["How long does a project take?", "Depends on scope, dependencies, and capacity. We give feasibility-checked dates in the quote, not on the marketing site."],
    ["Do you offer rush delivery?", "Tell us the date in the form as a preference. We'll say honestly whether it's feasible."],
  ]],
  ["Revisions & handover", [
    ["How do revisions work?", "Each quote states its revision allowance. Further rounds are quoted separately before continuing."],
    ["Who owns the work?", "You do, where handover is contracted: source code, design files, or exports plus setup notes."],
    ["Do you provide maintenance?", "Only where contracted as a separate agreement. Otherwise handover ends the engagement."],
  ]],
  ["Costs", [
    ["Are hosting and domains included?", "No — third-party costs are always separate unless a quote explicitly includes them."],
    ["Do you charge in INR?", "Yes, INR (₹) is our display currency. International enquiries are welcome."],
    ["Is there a payment gateway?", "No online payments in this release. Payments, if any, follow the written quote's milestones."],
  ]],
];

export default function FaqPage() {
  return (
    <>
      <PageHero title="Questions, answered plainly" lead="Scope, estimates, timelines, revisions, handoff, and recurring costs — without sales language." cta={<ButtonLink href="/start-project">Still unsure? Ask in a brief</ButtonLink>} />
      <div className="container-studio grid gap-8 py-12 lg:grid-cols-2">
        {groups.map(([g, items]) => (
          <section key={g} aria-label={g}>
            <h2 className="text-[17px] font-semibold">{g}</h2>
            <div className="mt-3 space-y-3">
              {items.map(([q, a]) => (
                <details key={q} className="rounded-[12px] border border-[var(--line)] bg-white p-5">
                  <summary className="cursor-pointer list-none text-[15px] font-semibold [&::-webkit-details-marker]:hidden">{q}</summary>
                  <p className="mt-2 text-[14.5px] leading-relaxed text-[#596273]">{a}</p>
                </details>
              ))}
            </div>
          </section>
        ))}
      </div>
    </>
  );
}
