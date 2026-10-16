import type { Metadata } from "next";
import { Card, PageHero } from "@/components/ui/primitives";
import { siteConfig } from "@/config/site";

/** Hairline draft note — a rule and a status dot, not a coloured warning box. */
function DraftNotice() {
  return (
    <p
      role="note"
      className="flex items-start gap-3 border-t border-[var(--line)] pt-4 text-[13.5px] leading-relaxed text-[var(--ink-2)]"
    >
      <span aria-hidden className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--warn)]" />
      <span>
        <span className="font-semibold text-[var(--ink)]">Draft.</span> Draft text pending business and
        legal review. Do not treat this page as final legal advice or a binding commitment.
      </span>
    </p>
  );
}

export function policyLayout(title: string, desc: string) {
  return { title, description: desc } as Metadata;
}

export function PolicyShell({ title, lead, children }: { title: string; lead: string; children: React.ReactNode }) {
  return (
    <>
      <PageHero title={title} lead={lead} />
      <section className="py-14 md:py-20">
        <div className="container-studio">
          <div className="mx-auto max-w-[820px]">
            <DraftNotice />
            <Card pad={false} className="mt-8 p-7 md:p-10">
              <div className="max-w-[68ch] text-[15px] leading-relaxed text-[var(--ink-2)] [&>h2]:mt-8 [&>h2]:border-t [&>h2]:border-[var(--line)] [&>h2]:pt-5 [&>p]:mt-3">
                {children}
              </div>
              <p className="mt-10 border-t border-[var(--line)] pt-4 text-[13px] text-[var(--ink-3)]">
                Notice version {siteConfig.privacyNoticeVersion} · Last reviewed: pending approval. For
                access, correction, or deletion requests, use the contact page.
              </p>
            </Card>
          </div>
        </div>
      </section>
    </>
  );
}
