import type { Metadata } from "next";
import Link from "next/link";
import { enabledServices } from "@/config/services";
import { approvedWork } from "@/config/work";
import { siteConfig } from "@/config/site";
import { ButtonLink, Card, Section } from "@/components/ui/primitives";

export const metadata: Metadata = {
  title: `${siteConfig.studioName} — Websites, Software, Design & AI`,
  description: "A small studio for websites, custom software, prototypes, brand assets, and practical AI. Tell us about your project.",
};

const faqs = [
  { q: "How do I start?", a: "Choose Describe your project — pick the closest service, describe the outcome you want, and share contact details. A human reviews every brief." },
  { q: "When do I get a price?", a: "After scope review. The form's budget bands are planning signals only — never a final quote." },
  { q: "Who owns the work?", a: "You do, where the quote includes handover — source code, design files, or exports as agreed in writing." },
  { q: "Do you take every project?", a: "No. If it is outside what we do well, we say so early rather than improvising." },
];

export default function HomePage() {
  const work = approvedWork();
  return (
    <>
      {/* Hero: asymmetric split */}
      <div className="border-b border-[var(--line)] bg-white">
        <div className="container-studio grid gap-10 py-14 md:grid-cols-[1.25fr_1fr] md:items-center md:py-20">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-[#F7F8FA] px-3 py-1.5 text-[12.5px] font-medium text-[#596273]">
              <span className="h-2 w-2 rounded-full bg-[#157347]" aria-hidden />
              Accepting scoped project enquiries
            </p>
            <h1 className="mt-5 max-w-[20ch] text-4xl font-bold leading-[1.04] tracking-tight md:text-6xl">
              {siteConfig.heroTitle}
            </h1>
            <p className="mt-4 max-w-[56ch] text-[16.5px] leading-relaxed text-[#596273]">
              {siteConfig.heroSubtitle} You don&apos;t need to know the tech — describe the outcome.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <ButtonLink href="/start-project">{siteConfig.primaryCta}</ButtonLink>
              <ButtonLink href="/work" variant="ghost">{siteConfig.secondaryCta}</ButtonLink>
            </div>
            <p className="mt-4 text-[13.5px] text-[#596273]">{siteConfig.responseNote}</p>
          </div>
          <aside aria-label="What a good brief includes" className="rounded-[16px] border border-[#151923] bg-[#151923] p-7 text-white">
            <p className="font-mono text-[12px] uppercase tracking-[0.14em] text-white/70">A good brief answers</p>
            <ul className="mt-4 space-y-4">
              {[
                ["What should change?", "The problem, goal, or output you want — in your own words."],
                ["Who is it for?", "Customers, your team, or both — and what they do today."],
                ["What does done look like?", "Pages, workflows, designs, or assets you expect back."],
              ].map(([t, d]) => (
                <li key={t} className="border-t border-white/15 pt-4 first:border-0 first:pt-0">
                  <p className="text-[15px] font-semibold">{t}</p>
                  <p className="mt-1 text-[14px] leading-relaxed text-white/70">{d}</p>
                </li>
              ))}
            </ul>
            <Link href="/start-project" className="mt-6 inline-flex min-h-[44px] items-center rounded-[10px] bg-white px-5 text-[14px] font-semibold text-[#151923] hover:bg-[#E9EDF5]">
              Describe your project
            </Link>
          </aside>
        </div>
      </div>

      <div className="container-studio">
        {/* Proof / work */}
        <Section>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold tracking-tight md:text-3xl">Selected work</h2>
              <p className="mt-2 max-w-[60ch] text-[15px] text-[#596273]">
                {work.length > 0
                  ? "Real, approved work first. Concept pieces are always labelled as concepts."
                  : "What we can help you build — client work appears here only once approved for publication."}
              </p>
            </div>
            <Link href="/work" className="text-[14px] font-semibold text-[#315BE8] hover:underline">
              All work →
            </Link>
          </div>
          {work.length > 1 ? (
            <div className="mt-7 grid gap-5 md:grid-cols-2">
              {work.slice(0, 2).map((w) => (
                <Link key={w.slug} href={`/work/${w.slug}`} className="group rounded-[16px] border border-[var(--line)] bg-white p-7 transition-shadow hover:shadow-[0_8px_30px_rgba(21,25,35,0.08)]">
                  {w.isConcept && (
                    <span className="inline-block rounded-full bg-[#FFF4D6] px-2.5 py-1 text-[12px] font-semibold text-[#8a5a00]">
                      Concept project · Self-initiated demo
                    </span>
                  )}
                  <h3 className="mt-3 text-[19px] font-semibold group-hover:underline">{w.title}</h3>
                  <p className="mt-2 text-[14.5px] leading-relaxed text-[#596273]">{w.summary}</p>
                </Link>
              ))}
            </div>
          ) : work.length === 1 ? (
            <Link href={`/work/${work[0].slug}`} className="group mt-7 flex flex-col gap-2 rounded-[16px] border border-[var(--line)] bg-white p-6 transition-shadow hover:shadow-[0_8px_30px_rgba(21,25,35,0.08)] md:flex-row md:items-center md:gap-6">
              {work[0].isConcept && (
                <span className="inline-block w-fit shrink-0 rounded-full bg-[#FFF4D6] px-2.5 py-1 text-[12px] font-semibold text-[#8a5a00]">
                  Concept project · Self-initiated demo
                </span>
              )}
              <span>
                <span className="block text-[17px] font-semibold group-hover:underline">{work[0].title}</span>
                <span className="mt-1 block text-[14px] text-[#596273]">{work[0].summary}</span>
              </span>
              <span aria-hidden className="shrink-0 text-[14px] font-semibold text-[#315BE8] md:ml-auto">Read →</span>
            </Link>
          ) : (
            <div className="mt-7">
              <Card>
                <p className="font-semibold">No published case studies yet.</p>
                <p className="mt-1 text-[14px] text-[#596273]">We will list genuine client work here once approved — never invented projects.</p>
              </Card>
            </div>
          )}
        </Section>

        {/* Service pillars */}
        <Section className="border-t border-[var(--line)]">
          <h2 className="text-2xl font-bold tracking-tight md:text-3xl">Five things we do well</h2>
          <p className="mt-2 max-w-[62ch] text-[15px] text-[#596273]">
            Outcome-led groups. If your need spans more than one, say so in the brief — you only pick one starting point.
          </p>
          <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {enabledServices().map((s, i) => (
              <Link
                key={s.slug}
                href={`/services/${s.slug}`}
                className="group rounded-[16px] border border-[var(--line)] bg-white p-6 transition-shadow hover:shadow-[0_8px_30px_rgba(21,25,35,0.08)]"
              >
                <p className="font-mono text-[12px] text-[#596273]">0{i + 1}</p>
                <h3 className="mt-2 text-[17px] font-semibold group-hover:underline">{s.title}</h3>
                <p className="mt-1.5 text-[14px] leading-relaxed text-[#596273]">{s.shortDescription}</p>
                <span className="mt-3 inline-block text-[13.5px] font-semibold text-[#315BE8]">Details →</span>
              </Link>
            ))}
            <Link href="/start-project" className="grid place-items-center rounded-[16px] border-2 border-[#151923] bg-[#315BE8] p-6 text-center text-white transition-colors hover:bg-[#2446BE]">
              <span>
                <span className="block text-[17px] font-semibold">Not sure which fits?</span>
                <span className="mt-1 block text-[14px] text-white">Describe the outcome — we&apos;ll route it.</span>
                <span className="mt-3 inline-block rounded-[10px] bg-white px-4 py-2.5 text-[14px] font-semibold text-[#151923]">{siteConfig.primaryCta}</span>
              </span>
            </Link>
          </div>
        </Section>

        {/* How it works */}
        <Section className="border-t border-[var(--line)]">
          <div className="grid gap-8 md:grid-cols-[1fr_1.6fr]">
            <div>
              <h2 className="text-2xl font-bold tracking-tight md:text-3xl">Brief → Handover</h2>
              <p className="mt-2 text-[15px] text-[#596273]">A short, written process. No black boxes.</p>
              <div className="mt-5 flex flex-wrap gap-3">
                <ButtonLink href="/process" variant="dark">How we work</ButtonLink>
              </div>
            </div>
            <ol className="divide-y divide-[var(--line)] rounded-[16px] border border-[var(--line)] bg-white">
              {[
                ["1. Brief", "You describe the outcome, audience, and what done looks like."],
                ["2. Scope", "We confirm deliverables, exclusions, and assumptions in writing."],
                ["3. Quote", "A human prices the scope. Third-party costs are listed separately."],
                ["4. Build & review", "We build in reviewable slices with explicit revision points."],
                ["5. Handover", "Source, files, or exports plus setup notes — as contracted."],
              ].map(([t, d]) => (
                <li key={t} className="flex gap-4 p-5">
                  <span className="text-[15px] font-bold">{t}</span>
                  <span className="text-[14.5px] text-[#596273]">{d}</span>
                </li>
              ))}
            </ol>
          </div>
        </Section>

        {/* Pricing philosophy */}
        <Section className="border-t border-[var(--line)]">
          <div className="rounded-[16px] bg-[#151923] p-8 text-white md:p-12">
            <h2 className="max-w-[24ch] text-2xl font-bold tracking-tight md:text-3xl">Scope-based pricing. No instant quotes.</h2>
            <p className="mt-3 max-w-[64ch] text-[15px] leading-relaxed text-white/70">
              Final price and timing depend on approved scope, feasibility, dependencies, and capacity. The enquiry form asks for a budget band only to plan the conversation — it is never a price promise.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/pricing" className="inline-flex min-h-[44px] items-center rounded-[10px] bg-white px-5 text-[14px] font-semibold text-[#151923]">How pricing works</Link>
              <Link href="/start-project" className="inline-flex min-h-[44px] items-center rounded-[10px] border border-white/30 px-5 text-[14px] font-semibold text-white hover:bg-white/10">Request an estimate</Link>
            </div>
          </div>
        </Section>

        {/* Why this process works */}
        <Section className="border-t border-[var(--line)]">
          <h2 className="text-2xl font-bold tracking-tight md:text-3xl">Why this process works</h2>
          <div className="mt-6 grid gap-5 md:grid-cols-3">
            {[
              ["Written scope", "Deliverables and exclusions agreed before build — fewer surprises."],
              ["Feasibility-checked timelines", "Dates follow dependency and capacity checks, not optimism."],
              ["Direct communication", "You talk to the people doing the work, not a ticket queue."],
            ].map(([t, d]) => (
              <Card key={t}>
                <h3 className="text-[16px] font-semibold">{t}</h3>
                <p className="mt-1.5 text-[14px] leading-relaxed text-[#596273]">{d}</p>
              </Card>
            ))}
          </div>
        </Section>

        {/* FAQ */}
        <Section className="border-t border-[var(--line)]">
          <div className="grid gap-8 md:grid-cols-[1fr_2fr]">
            <div>
              <h2 className="text-2xl font-bold tracking-tight md:text-3xl">Common questions</h2>
              <Link href="/faq" className="mt-3 inline-block text-[14px] font-semibold text-[#315BE8] hover:underline">All FAQs →</Link>
            </div>
            <div className="space-y-3">
              {faqs.map((f) => (
                <details key={f.q} className="group rounded-[12px] border border-[var(--line)] bg-white p-5">
                  <summary className="cursor-pointer list-none text-[15px] font-semibold [&::-webkit-details-marker]:hidden">
                    {f.q} <span aria-hidden="true" className="float-right text-[#596273] group-open:rotate-45">+</span>
                  </summary>
                  <p className="mt-2 text-[14.5px] leading-relaxed text-[#596273]">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </Section>

        {/* Final CTA */}
        <Section className="border-t border-[var(--line)]">
          <div className="rounded-[16px] bg-[#151923] p-8 text-white md:p-12">
            <h2 className="mx-auto max-w-[26ch] text-center text-2xl font-bold tracking-tight md:text-3xl">Send two paragraphs, get a human reply and a reference.</h2>
            <ol className="mx-auto mt-6 grid max-w-[720px] gap-3 text-left sm:grid-cols-3">
              {[
                ["1. Reference", "Shown immediately on success."],
                ["2. Human review", "Feasibility, fit, questions."],
                ["3. Written scope", "Agreed before any quote."],
              ].map(([t, d]) => (
                <li key={t} className="rounded-[12px] border border-white/15 p-4">
                  <p className="text-[14.5px] font-semibold">{t}</p>
                  <p className="mt-1 text-[13.5px] text-white/70">{d}</p>
                </li>
              ))}
            </ol>
            <div className="mt-7 flex justify-center">
              <Link href="/start-project" className="inline-flex min-h-[48px] items-center rounded-[10px] bg-white px-7 text-[15px] font-semibold text-[#151923] transition-all hover:bg-[#E9EDF5] active:translate-y-[1px]">
                {siteConfig.primaryCta}
              </Link>
            </div>
          </div>
        </Section>
      </div>
    </>
  );
}
