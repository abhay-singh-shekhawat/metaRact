import type { Metadata } from "next";
import { ButtonLink, Eyebrow, PageHero, Section } from "@/components/ui/primitives";
import { Reveal } from "@/components/motion/Reveal";

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
      <PageHero
        eyebrow={<Eyebrow>FAQ</Eyebrow>}
        folio="DOC 08 / FAQ"
        title="Questions, answered plainly"
        lead="Scope, estimates, timelines, revisions, handoff, and recurring costs — without sales language."
        meta={[
          { k: "Groups", v: "Four" },
          { k: "Questions", v: "Twelve, answered plainly" },
          { k: "Estimates", v: "After scope and feasibility checks" },
          { k: "Currency", v: "INR (₹) is the display currency" },
        ]}
        cta={<ButtonLink href="/start-project">Still unsure? Ask in a brief</ButtonLink>}
      />

      {/* ── Two editorial columns, four groups, rows divided by hairlines ──── */}
      <Section tone="plain">
        <div className="container-studio grid gap-x-16 gap-y-12 lg:grid-cols-2">
          {groups.map(([g, items]) => (
            <section key={g} aria-label={g} className="min-w-0">
              <Reveal>
                <h2 className="display-h2 text-[20px]">{g}</h2>
                <div className="mt-5 border-t border-[var(--line)]">
                  {items.map(([q, a]) => (
                    <details key={q} className="group border-b border-[var(--line)]">
                      <summary className="flex cursor-pointer list-none items-start justify-between gap-6 py-5 text-[15.5px] font-semibold [&::-webkit-details-marker]:hidden">
                        <span>{q}</span>
                        <span
                          aria-hidden
                          className="shrink-0 text-[22px] font-normal leading-none text-[var(--ink-3)] transition-transform duration-300 group-open:rotate-45 group-open:text-[var(--accent)]"
                        >
                          +
                        </span>
                      </summary>
                      <p className="max-w-[68ch] pr-8 pb-6 text-[14.5px] leading-relaxed text-[var(--ink-2)]">
                        {a}
                      </p>
                    </details>
                  ))}
                </div>
              </Reveal>
            </section>
          ))}
        </div>
      </Section>
    </>
  );
}
