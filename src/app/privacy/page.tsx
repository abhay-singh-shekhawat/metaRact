import type { Metadata } from "next";
import { LegalPage } from "@/components/marketing/LegalPage";
import { siteConfig } from "@/config/site";
import { privacyPolicyDoc } from "@/content/legal/privacy-policy";

export const metadata: Metadata = {
  title: privacyPolicyDoc.title,
  description: `How ${siteConfig.studioName} collects, uses, shares and retains information when you visit this website, send an enquiry, or engage us on a project.`,
};

export default function PrivacyPolicyPage() {
  return (
    <LegalPage
      doc={privacyPolicyDoc}
      lead="What we collect when you contact us or send a brief, why we hold it, who sees it, how long we keep it, and the choices you have."
    />
  );
}
