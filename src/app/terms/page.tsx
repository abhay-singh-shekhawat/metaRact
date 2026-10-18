import type { Metadata } from "next";
import { LegalPage } from "@/components/marketing/LegalPage";
import { siteConfig } from "@/config/site";
import { termsOfServiceDoc } from "@/content/legal/terms-of-service";

export const metadata: Metadata = {
  title: termsOfServiceDoc.title,
  description: `The general terms for using the ${siteConfig.studioName} website and engaging us: what an enquiry is, how a quote governs work, and how changes, revisions and responsibility are handled.`,
};

export default function TermsOfServicePage() {
  return (
    <LegalPage
      doc={termsOfServiceDoc}
      lead="The general terms for this website and for engaging us: what an enquiry is, how a quote governs work, how changes and revisions are handled, and where responsibility sits."
    />
  );
}
