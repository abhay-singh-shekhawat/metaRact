import type { Metadata } from "next";
import { PageHero, Card } from "@/components/ui/primitives";
import { siteConfig } from "@/config/site";

function DraftNotice() {
  return (
    <p role="note" className="rounded-[12px] border border-[#E8C547] bg-[#FFF8E1] p-4 text-[14px] font-medium text-[#6b4e00]">
      Draft text pending business and legal review. Do not treat this page as final legal advice or a binding commitment.
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
      <div className="container-studio max-w-[820px] space-y-5 py-12">
        <DraftNotice />
        <Card>
          <div className="space-y-4 text-[14.5px] leading-relaxed text-[#333c4d]">{children}</div>
          <p className="mt-6 border-t border-[var(--line)] pt-4 text-[13px] text-[#596273]">
            Notice version {siteConfig.privacyNoticeVersion} · Last reviewed: pending approval. For access, correction, or deletion requests, use the contact page.
          </p>
        </Card>
      </div>
    </>
  );
}
