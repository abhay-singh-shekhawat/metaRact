import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHero, Card } from "@/components/ui/primitives";
import { EnquiryFormClient } from "./form-client";

export const metadata: Metadata = {
  title: "Start a Project",
  description: "Describe your project in plain language. A human reviews every brief and replies with a reference number.",
};

export default function StartProjectPage() {
  return (
    <>
      <PageHero
        title="Start a project"
        lead="Two minutes, plain language, no account. Pick the closest service, describe the outcome, and we'll confirm scope before any quote."
      />
      <div className="container-studio grid gap-6 py-12 lg:grid-cols-[1.6fr_1fr]">
        <div className="rounded-[16px] border border-[var(--line)] bg-white p-6 md:p-8">
          <Suspense fallback={<p className="text-[14px] text-[#596273]">Loading form…</p>}>
            <EnquiryFormClient />
          </Suspense>
        </div>
        <aside className="space-y-5">
          <Card>
            <h2 className="text-[16px] font-semibold">What happens next</h2>
            <ol className="mt-3 space-y-2.5 text-[14px] text-[#596273]">
              <li><strong className="text-[#151923]">1. Reference number</strong> — shown immediately on success.</li>
              <li><strong className="text-[#151923]">2. Human review</strong> — feasibility, fit, and clarifying questions.</li>
              <li><strong className="text-[#151923]">3. Written scope</strong> — deliverables and exclusions agreed.</li>
              <li><strong className="text-[#151923]">4. Quote</strong> — price and timeline follow the scope.</li>
            </ol>
          </Card>
          <Card>
            <h2 className="text-[16px] font-semibold">Good to know</h2>
            <ul className="mt-3 space-y-2 text-[14px] text-[#596273]">
              <li>Budget bands and dates are preferences, never commitments.</li>
              <li>Reference URLs only — no file uploads in this release.</li>
              <li>Never send passwords, keys, or sensitive personal data.</li>
            </ul>
          </Card>
        </aside>
      </div>
    </>
  );
}
