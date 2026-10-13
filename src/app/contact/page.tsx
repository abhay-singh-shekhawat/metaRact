import type { Metadata } from "next";
import Link from "next/link";
import { PageHero, Card, ButtonLink } from "@/components/ui/primitives";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = { title: "Contact", description: "Approved contact channels and the project enquiry form." };

export default function ContactPage() {
  const email = siteConfig.contactEmail;
  return (
    <>
      <PageHero title="Contact" lead="For project enquiries, the form is fastest — it creates a tracked reference. For anything else, use the channels below." />
      <div className="container-studio grid gap-5 py-12 md:grid-cols-2">
        <Card>
          <h2 className="text-[17px] font-semibold">Start a project</h2>
          <p className="mt-2 text-[14.5px] text-[#596273]">Two minutes, plain language, tracked reference number, human reply.</p>
          <div className="mt-4"><ButtonLink href="/start-project">{siteConfig.primaryCta}</ButtonLink></div>
        </Card>
        <Card>
          <h2 className="text-[17px] font-semibold">Direct channels</h2>
          {email ? (
            <p className="mt-2 text-[14.5px]"><Link className="text-[#315BE8] font-semibold hover:underline" href={`mailto:${email}`}>{email}</Link></p>
          ) : (
            <p className="mt-2 text-[14.5px] text-[#596273]">Public contact email will appear here once approved. Meanwhile, please use the project form.</p>
          )}
          {siteConfig.whatsappUrl && (
            <p className="mt-2 text-[14.5px]"><Link className="text-[#315BE8] font-semibold hover:underline" href={siteConfig.whatsappUrl}>WhatsApp</Link></p>
          )}
          <p className="mt-3 text-[13.5px] text-[#596273]">Please don&apos;t send passwords, API keys, or sensitive personal data by any channel.</p>
        </Card>
      </div>
    </>
  );
}
