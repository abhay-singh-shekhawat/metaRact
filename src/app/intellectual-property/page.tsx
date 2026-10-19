import type { Metadata } from "next";
import { LegalPage } from "@/components/marketing/LegalPage";
import { siteConfig } from "@/config/site";
import { intellectualPropertyPolicyDoc } from "@/content/legal/intellectual-property-policy";

export const metadata: Metadata = {
  title: intellectualPropertyPolicyDoc.title,
  description: `Who owns what on a ${siteConfig.studioName} project: client materials, our reusable tools, custom deliverables, third-party components, AI outputs, and portfolio permission.`,
};

export default function IntellectualPropertyPolicyPage() {
  return (
    <LegalPage
      doc={intellectualPropertyPolicyDoc}
      lead="Who owns what: your materials, our reusable tools, custom deliverables, third-party and open-source components, AI outputs, and portfolio display."
    />
  );
}
