import type { Metadata } from "next";
import Link from "next/link";
import { enabledServices } from "@/config/services";
import { approvedWork } from "@/config/work";
import { siteConfig } from "@/config/site";
import { ButtonLink, Card, Chip, Eyebrow, Panel, Section, SectionHeading, Tick } from "@/components/ui/primitives";
import { Reveal } from "@/components/motion/Reveal";
import { HeroObject } from "@/components/marketing/HeroObject";

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

const steps: [string, string][] = [
  ["Brief", "You describe the outcome, the audience, and what done looks like."],
  ["Scope", "We confirm deliverables, exclusions, and assumptions in writing."],
  ["Quote", "A human prices the scope. Third-party costs are listed separately."],
  ["Build & review", "We build in reviewable slices with explicit revision points."],
  ["Handover", "Source, files, or exports plus setup notes — as contracted."],
];

export default function HomePage() {
  const work = approvedWork();

  return (
    <>
      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-[var(--line)] bg-[var(--surface)]">
        <div aria-hidden className="grid-backdrop pointer-events-none absolute inset-0 opacity-60" />
        <div
          aria-hidden
          className="pointer-events-none absolute -left-40 top-[-160px] h-[520px] w-[520px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(42,60,240,0.12), transparent 66%)" }}
        />
        <div className="container-studio relative grid items-center gap-12 pt-14 pb-16 md:pt-20 md:pb-24 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <Chip className="!border-[var(--line-2)]">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" aria-hidden />
              Human-reviewed briefs · no instant quotes
            </Chip>
            <h1 className="display-hero mt-6 max-w-[17ch] text-balance">{siteConfig.heroTitle}</h1>
            <p className="lead mt-6 max-w-[50ch]">
              {siteConfig.heroSubtitle} You don&apos;t need to know the tech — describe the outcome.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href="/start-project">{siteConfig.primaryCta}</ButtonLink>
              <ButtonLink href="/work" variant="secondary">
                {siteConfig.secondaryCta}
              </ButtonLink>
            </div>
            <p className="meta mt-6">{siteConfig.responseNote}</p>
          </div>

          <div className="relative">
            <HeroObject />
          </div>
        </div>
      </section>

      {/* ── Facts strip ───────────────────────────────────────────────────── */}
      <section className="border-b border-[var(--line)] bg-[var(--canvas)]">
        <div className="container-studio grid divide-y divide-[var(--line)] sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          {[
            ["Every brief is read by a person", "No routing bots, no auto-acceptance."],
            ["Scope is written before any quote", "Deliverables and exclusions, agreed."],
            ["Handover is whatever the quote says", "Source, files or exports — documented."],
          ].map(([t, d], i) => (
            <Reveal key={t} as="div" delay={i * 70} className="px-0 py-6 sm:px-8 sm:py-8 sm:first:pl-0 sm:last:pr-0">
              <p className="display-h3 text-[15px]">{t}</p>
              <p className="mt-1.5 text-[13.5px] leading-relaxed text-[var(--ink-2)]">{d}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── Selected work (ledger rows, not cards) ────────────────────────── */}
      <Section>
        <div className="container-studio">
          <SectionHeading
            title="Selected work"
            lead={
              work.length > 0
                ? "Real, approved work first. Concept pieces are always labelled as concepts."
                : "What we can help you build — client work appears here only once approved for publication."
            }
            action={
              <Link href="/work" className="link-inline text-[14px]">
                All work
              </Link>
            }
          />

          {work.length === 0 ? (
            <Reveal className="mt-10">
              <Card className="max-w-[62ch] bg-[var(--surface-2)]">
                <p className="font-semibold">No published case studies yet.</p>
                <p className="mt-1.5 text-[14px] leading-relaxed text-[var(--ink-2)]">
                  We will list genuine client work here once approved — never invented projects.
                </p>
              </Card>
            </Reveal>
          ) : (
            <ol className="mt-10 border-t border-[var(--line)]">
              {work.slice(0, 4).map((w, i) => (
                <Reveal as="li" key={w.slug} delay={i * 70} className="border-b border-[var(--line)]">
                  <Link
                    href={`/work/${w.slug}`}
                    className="group grid grid-cols-[auto_1fr] items-start gap-x-6 gap-y-3 py-7 transition-colors hover:bg-[var(--surface-2)] md:grid-cols-[64px_1fr_auto] md:items-center md:gap-x-8"
                  >
                    <span className="meta pt-1 md:pt-0">{String(i + 1).padStart(2, "0")}</span>
                    <span>
                      <span className="flex flex-wrap items-center gap-3">
                        <span className="display-h3 group-hover:text-[var(--accent)]">{w.title}</span>
                        {w.isConcept && <Chip>Concept · self-initiated</Chip>}
                      </span>
                      <span className="mt-2 block max-w-[64ch] text-[14.5px] leading-relaxed text-[var(--ink-2)]">
                        {w.summary}
                      </span>
                    </span>
                    <span
                      aria-hidden
                      className="col-start-2 text-[14px] font-semibold text-[var(--accent)] transition-transform duration-300 group-hover:translate-x-1 md:col-start-3"
                    >
                      Read →
                    </span>
                  </Link>
                </Reveal>
              ))}
            </ol>
          )}
        </div>
      </Section>

      {/* ── Service pillars (bento with real variation) ───────────────────── */}
      <Section tone="surface">
        <div className="container-studio">
          <SectionHeading
            eyebrow={<Eyebrow>Services</Eyebrow>}
            title="Five things we do well"
            lead="Outcome-led groups. If your need spans more than one, say so in the brief — you only pick one starting point."
          />

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
            {enabledServices().map((s, i) => {
              // 3 + 2 bento: the first row spans three, the second spans two and a CTA.
              const span = i < 3 ? "lg:col-span-2" : "lg:col-span-3";
              return (
                <Reveal key={s.slug} delay={i * 60} className={span}>
                  <Link href={`/services/${s.slug}`} className="surface-link flex h-full flex-col p-6">
                    <span className="meta">0{i + 1}</span>
                    <span className="display-h3 mt-3">{s.title}</span>
                    <span className="mt-2 block text-[14px] leading-relaxed text-[var(--ink-2)]">{s.shortDescription}</span>
                    <span className="mt-5 flex flex-wrap gap-x-4 gap-y-1.5">
                      {s.outcomePoints.map((o) => (
                        <span key={o} className="flex items-start gap-1.5 text-[13px] text-[var(--ink-2)]">
                          <Tick />
                          {o}
                        </span>
                      ))}
                    </span>
                    <span className="mt-auto pt-6 text-[13.5px] font-semibold text-[var(--accent)]">Details →</span>
                  </Link>
                </Reveal>
              );
            })}
            <Reveal delay={300} className="lg:col-span-3">
              <Link
                href="/start-project"
                className="group flex h-full flex-col justify-between gap-6 rounded-[16px] border border-[var(--ink)] bg-[var(--ink)] p-6 text-white"
              >
                <span className="meta !text-white/60">Unsure?</span>
                <span className="display-h3 text-[19px] text-white">
                  Not sure which fits? Describe the outcome — we&apos;ll route it.
                </span>
                <span className="btn-onink w-fit">{siteConfig.primaryCta}</span>
              </Link>
            </Reveal>
          </div>
        </div>
      </Section>

      {/* ── Process rail (numbered ledger) ───────────────────────────────── */}
      <Section>
        <div className="container-studio">
          <SectionHeading
            eyebrow={<Eyebrow>Process</Eyebrow>}
            title="Brief → Handover"
            lead="A short, written process. Every step produces something you can read — nothing runs on vibes."
            action={<ButtonLink href="/process" variant="secondary">How we work</ButtonLink>}
          />
          <ol className="mt-10 grid gap-px overflow-hidden rounded-[16px] border border-[var(--line)] bg-[var(--line)] md:grid-cols-5">
            {steps.map(([t, d], i) => (
              <Reveal
                as="li"
                key={t}
                delay={i * 60}
                className="group bg-[var(--surface)] p-6 transition-colors duration-300 hover:bg-[var(--surface-2)]"
              >
                <span className="meta text-[var(--accent)]">{String(i + 1).padStart(2, "0")}</span>
                <span className="display-h3 mt-3 block">{t}</span>
                <span className="mt-2 block text-[13.5px] leading-relaxed text-[var(--ink-2)]">{d}</span>
              </Reveal>
            ))}
          </ol>
        </div>
      </Section>

      {/* ── Pricing philosophy (ink panel) ───────────────────────────────── */}
      <Section tone="surface">
        <div className="container-studio">
          <Reveal>
            <Panel ink className="grid gap-10 p-8 md:grid-cols-[1.2fr_1fr] md:p-12">
              <div>
                <Eyebrow>Pricing</Eyebrow>
                <h2 className="display-h2 mt-4 max-w-[22ch] text-white text-balance">
                  Scope-based pricing. No instant quotes.
                </h2>
                <p className="mt-4 max-w-[58ch] text-[15px] leading-relaxed text-white/70">
                  Final price and timing depend on approved scope, feasibility, dependencies, and capacity. The
                  enquiry form asks for a budget band only to plan the conversation — it is never a price promise.
                </p>
                <div className="mt-7 flex flex-wrap gap-3">
                  <Link href="/pricing" className="btn-onink">
                    How pricing works
                  </Link>
                  <Link href="/start-project" className="btn-onink-outline">
                    Request an estimate
                  </Link>
                </div>
              </div>
              <dl className="grid content-start border-t border-white/15">
                {[
                  ["In the quote", "Deliverables, exclusions, milestones, revisions."],
                  ["Always separate", "Domains, hosting, licences, API usage, print."],
                  ["Never", "Binding prices before scope, or guaranteed claims."],
                ].map(([k, v]) => (
                  <div key={k} className="border-b border-white/15 py-4">
                    <dt className="meta !text-white/55">{k}</dt>
                    <dd className="mt-1.5 text-[14px] leading-relaxed text-white/85">{v}</dd>
                  </div>
                ))}
              </dl>
            </Panel>
          </Reveal>
        </div>
      </Section>

      {/* ── Why this works (hairline columns, no cards) ──────────────────── */}
      <Section>
        <div className="container-studio">
          <SectionHeading title="Why this process works" className="max-w-[40ch]" />
          <div className="mt-10 grid gap-px overflow-hidden rounded-[16px] border border-[var(--line)] bg-[var(--line)] md:grid-cols-3">
            {[
              ["Written scope", "Deliverables and exclusions agreed before build — fewer surprises."],
              ["Feasibility-checked timelines", "Dates follow dependency and capacity checks, not optimism."],
              ["Direct communication", "You talk to the people doing the work, not a ticket queue."],
            ].map(([t, d], i) => (
              <Reveal key={t} delay={i * 70} className="bg-[var(--surface)] p-8">
                <p className="display-h2 text-[28px] text-[var(--accent)]/25">{String(i + 1).padStart(2, "0")}</p>
                <p className="display-h3 mt-4">{t}</p>
                <p className="mt-2 text-[14px] leading-relaxed text-[var(--ink-2)]">{d}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </Section>

      {/* ── FAQ ──────────────────────────────────────────────────────────── */}
      <Section tone="surface">
        <div className="container-studio grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <h2 className="display-h2 max-w-[16ch] text-balance">Common questions</h2>
            <Link href="/faq" className="link-inline mt-4 inline-block text-[14px]">
              All FAQs
            </Link>
          </div>
          <div className="border-t border-[var(--line)]">
            {faqs.map((f) => (
              <details key={f.q} className="group border-b border-[var(--line)]">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5 text-[15.5px] font-semibold [&::-webkit-details-marker]:hidden">
                  {f.q}
                  <span
                    aria-hidden
                    className="grid h-6 w-6 shrink-0 place-items-center rounded-full border border-[var(--line-2)] text-[15px] leading-none text-[var(--ink-2)] transition-transform duration-300 group-open:rotate-45"
                  >
                    +
                  </span>
                </summary>
                <p className="max-w-[68ch] pb-5 text-[14.5px] leading-relaxed text-[var(--ink-2)]">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </Section>

      {/* ── Final CTA ────────────────────────────────────────────────────── */}
      <Section>
        <div className="container-studio">
          <Reveal>
            <Panel ink className="p-8 text-center md:p-14">
              <h2 className="display-h2 mx-auto max-w-[24ch] text-white text-balance">
                Send two paragraphs, get a human reply and a reference.
              </h2>
              <ol className="mx-auto mt-9 grid max-w-[760px] gap-px overflow-hidden rounded-[14px] border border-white/15 bg-white/15 text-left sm:grid-cols-3">
                {[
                  ["1. Reference", "Shown immediately on success."],
                  ["2. Human review", "Feasibility, fit, and questions."],
                  ["3. Written scope", "Agreed before any quote."],
                ].map(([t, d]) => (
                  <li key={t} className="bg-[var(--ink)] p-5">
                    <p className="text-[14.5px] font-semibold text-white">{t}</p>
                    <p className="mt-1 text-[13.5px] leading-relaxed text-white/70">{d}</p>
                  </li>
                ))}
              </ol>
              <div className="mt-9 flex justify-center">
                <Link href="/start-project" className="btn-onink !min-h-[48px] !px-7 !text-[15px]">
                  {siteConfig.primaryCta}
                </Link>
              </div>
            </Panel>
          </Reveal>
        </div>
      </Section>
    </>
  );
}
