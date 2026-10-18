import type { Metadata } from "next";
import { LegalPage } from "@/components/marketing/LegalPage";
import { siteConfig } from "@/config/site";
import { cancellationRefundPolicyDoc } from "@/content/legal/cancellation-refund-policy";

export const metadata: Metadata = {
  title: cancellationRefundPolicyDoc.title,
  description: `How cancellation, refunds, pauses and third-party expenses work on a ${siteConfig.studioName} project, before and after 25% of the agreed timeline has elapsed.`,
};

export default function CancellationPolicyPage() {
  return (
    <LegalPage
      doc={cancellationRefundPolicyDoc}
      lead="How cancellation, refunds, pauses and third-party expenses work — before 25% of an agreed project timeline has elapsed, and at or after it."
    />
  );
}
