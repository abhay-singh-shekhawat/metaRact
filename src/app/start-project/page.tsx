import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { Card, Eyebrow, PageHero, Tick } from "@/components/ui/primitives";
import { getTurnstileSiteKey } from "@/lib/public-env";
import { EnquiryFormClient } from "./form-client";

export const metadata: Metadata = {
  title: "Start a Project",
  description: "Describe your project in plain language. A human reviews every brief and replies with a reference number.",
};

// Render per request so the public Turnstile key can come from the Worker's
// runtime environment as well as the production build. Without this the page can
// be statically cached with an empty key and the widget never mounts.
export const dynamic = "force-dynamic";

const nextSteps: [string, string][] = [
  ["Reference number", "Shown immediately on success — quote it in any follow-up."],
  ["Human review", "Feasibility, fit, and any clarifying questions."],
  ["Written scope", "Deliverables and exclusions agreed before build."],
  ["Quote", "Price and timeline follow the scope, not the other way round."],
];

const goodToKnow = [
  "Budget bands and dates are preferences, never commitments.",
  "Reference URLs only — no file uploads in this release.",
  "Never send passwords, keys, or sensitive personal data.",
];

export default function StartProjectPage() {
  const turnstileSiteKey = getTurnstileSiteKey();

  return (
    <>
      <PageHero
        eyebrow={<Eyebrow>Enquiry</Eyebrow>}
        folio="FORM 01 / ENQUIRY"
        title="Start a project"
        lead="Two minutes, plain language, no account. Pick the closest service, describe the outcome, and we'll confirm scope before any quote."
        meta={[
          { k: "Time", v: "About two minutes" },
          { k: "Account", v: "None required" },
          { k: "Uploads", v: "None — reference links only" },
          { k: "Reply", v: "From a person, to your contact details" },
        ]}
      />

      <section className="band py-16 md:py-24">
        <div className="container-studio grid gap-8 lg:grid-cols-[1.6fr_1fr] lg:gap-12">
          <div className="card p-6 md:p-9">
            <Suspense
              fallback={
                <div className="space-y-5" aria-hidden>
                  <div className="h-4 w-3/4 animate-pulse rounded bg-[var(--canvas-2)]" />
                  <div className="h-11 w-full animate-pulse rounded-[10px] bg-[var(--canvas-2)]" />
                  <div className="h-11 w-full animate-pulse rounded-[10px] bg-[var(--canvas-2)]" />
                  <div className="h-32 w-full animate-pulse rounded-[10px] bg-[var(--canvas-2)]" />
                  <p className="text-[14px] text-[var(--ink-3)]">Loading form…</p>
                </div>
              }
            >
              <EnquiryFormClient turnstileSiteKey={turnstileSiteKey} />
            </Suspense>
          </div>

          <aside className="space-y-5 lg:sticky lg:top-28 lg:self-start">
            <Card>
              <p className="meta">What happens next</p>
              <ol className="mt-4 border-t border-[var(--line)]">
                {nextSteps.map(([t, d], i) => (
                  <li key={t} className="flex gap-4 border-b border-[var(--line)] py-3.5">
                    <span className="meta pt-[3px] text-[var(--accent)]">{String(i + 1).padStart(2, "0")}</span>
                    <span>
                      <span className="block text-[14.5px] font-semibold">{t}</span>
                      <span className="mt-0.5 block text-[13.5px] leading-relaxed text-[var(--ink-2)]">{d}</span>
                    </span>
                  </li>
                ))}
              </ol>
            </Card>

            <Card>
              <p className="meta">Good to know</p>
              <ul className="mt-4 space-y-2.5">
                {goodToKnow.map((g) => (
                  <li key={g} className="flex items-start gap-2.5 text-[13.5px] leading-relaxed text-[var(--ink-2)]">
                    <Tick tone="muted" />
                    {g}
                  </li>
                ))}
              </ul>
              <p className="mt-4 border-t border-[var(--line)] pt-4 text-[13px] text-[var(--ink-3)]">
                Prefer to read first?{" "}
                <Link href="/faq" className="link-inline">
                  Read the FAQs
                </Link>
                .
              </p>
            </Card>
          </aside>
        </div>
      </section>
    </>
  );
}
