import type { Metadata } from "next";
import { ButtonLink, Chip, Dash, Eyebrow, PageHero, Panel, Section } from "@/components/ui/primitives";
import { Reveal } from "@/components/motion/Reveal";

export const metadata: Metadata = { title: "Pricing", description: "How we price: scope-based human quotes, planning budget bands, separate third-party costs." };

const quoteContents = [
  "Agreed deliverables and exclusions",
  "Service fee for the studio's work",
  "Estimated third-party expenses, listed separately",
  "Payment milestones and schedule assumptions",
  "Revision allowance and validity period",
];

const alwaysSeparate = [
  "Domain registration and hosting",
  "Premium themes, plugins, stock and font licences",
  "Third-party API and model usage",
  "App-store fees and payment-provider charges",
  "Ongoing maintenance unless contracted",
];

const bands = ["Under ₹10,000", "₹10–30k", "₹30–75k", "₹75k–1.5L", "Over ₹1.5L", "Not sure", "Prefer not to say"];

const refusals = [
  "No binding prices before scope review.",
  "No “cheapest / guaranteed / instant” claims.",
  "No automated acceptance of work.",
];

export default function PricingPage() {
  return (
    <>
      <PageHero
        eyebrow={<Eyebrow>Pricing</Eyebrow>}
        folio="DOC 06 / PRICING"
        title="Pricing follows scope — not the other way round"
        lead="There is no instant calculator here. You tell us the outcome, we confirm what's included, then a human prices it. Budget bands in the form are planning signals only."
        meta={[
          { k: "Quoted by", v: "A human, after scope review" },
          { k: "Currency", v: "INR (₹) is the display currency" },
          { k: "Third-party costs", v: "Listed separately, never bundled" },
          { k: "Payments", v: "Follow the quote's milestones" },
          { k: "Budget bands", v: "Planning only — never a quote" },
        ]}
        cta={<ButtonLink href="/start-project">Request an estimate</ButtonLink>}
      />

      {/* ── Quote contents (numbered ledger) beside an ink spec panel ─────── */}
      <Section tone="plain">
        <div className="container-studio grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
          <div className="min-w-0">
            <h2 className="display-h2 text-[24px] text-balance">What a quote contains</h2>
            <ol className="mt-8 border-t border-[var(--line)]">
              {quoteContents.map((x, i) => (
                <Reveal
                  as="li"
                  key={x}
                  delay={Math.min(i, 4) * 50}
                  className="grid grid-cols-[40px_1fr] gap-4 border-b border-[var(--line)] py-5"
                >
                  <span className="meta pt-[3px]">{String(i + 1).padStart(2, "0")}</span>
                  <span className="text-[15px] leading-relaxed text-[var(--ink-2)]">{x}</span>
                </Reveal>
              ))}
            </ol>
          </div>

          <Reveal delay={80} className="min-w-0">
            <Panel ink className="p-7 md:p-9">
              <h2 className="display-h3 text-[20px] text-white">Always separate</h2>
              <p className="mt-3 max-w-[42ch] text-[14px] leading-relaxed">
                Kept outside the studio&apos;s fee and listed on their own:
              </p>
              <ul className="mt-5 border-t border-white/15">
                {alwaysSeparate.map((x) => (
                  <li
                    key={x}
                    className="flex items-start gap-3 border-b border-white/15 py-3.5 text-[14px] leading-relaxed text-white/85"
                  >
                    <span aria-hidden className="mt-[10px] h-px w-3.5 shrink-0 bg-white/45" />
                    <span>{x}</span>
                  </li>
                ))}
              </ul>
            </Panel>
          </Reveal>
        </div>
      </Section>

      {/* ── Budget bands as a full-width spec strip ───────────────────────── */}
      <Section tone="surface">
        <div className="container-studio">
          <Reveal>
            <div className="flex flex-wrap items-baseline justify-between gap-x-8 gap-y-3">
              <h2 className="display-h2 text-[24px]">Budget bands (INR, planning only)</h2>
              <p className="meta">Planning signals · never prices</p>
            </div>
            <ul className="mt-8 flex flex-wrap gap-2 border-t border-[var(--line)] pt-8">
              {bands.map((b) => (
                <li key={b}>
                  <Chip>{b}</Chip>
                </li>
              ))}
            </ul>
            <p className="mt-6 max-w-[62ch] text-[15px] leading-relaxed text-[var(--ink-2)]">
              These help us plan the first conversation. They are not prices, promises, or discounts.
            </p>
          </Reveal>
        </div>
      </Section>

      {/* ── What we won't do (refusals as hairline rows) ──────────────────── */}
      <Section tone="plain">
        <div className="container-studio grid gap-10 md:grid-cols-[0.8fr_1.2fr] md:gap-16">
          <div>
            <h2 className="display-h2 max-w-[14ch] text-balance">What we won&apos;t do</h2>
            <div className="mt-7">
              <ButtonLink href="/start-project">Describe your project</ButtonLink>
            </div>
          </div>
          <ul className="border-t border-[var(--line)]">
            {refusals.map((r, i) => (
              <Reveal
                as="li"
                key={r}
                delay={i * 60}
                className="flex items-start gap-3 border-b border-[var(--line)] py-[18px] text-[15px] leading-relaxed text-[var(--ink-2)]"
              >
                <Dash />
                <span>{r}</span>
              </Reveal>
            ))}
          </ul>
        </div>
      </Section>
    </>
  );
}
