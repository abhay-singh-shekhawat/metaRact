import { PolicyShell, policyLayout } from "@/components/marketing/PolicyShell";

export const metadata = policyLayout("Cancellation & Refunds", "How cancellation and refunds work once a written quote exists.");

export default function CancellationPage() {
  return (
    <PolicyShell title="Cancellation & refunds" lead="No online payments are taken on this site. If a quoted engagement is cancelled, the written quote's terms decide what happens next.">
      <h2 className="font-semibold text-[#151923]">Before a quote</h2>
      <p>Withdrawing an enquiry is free — just reply to our email or use the contact page with your reference number.</p>
      <h2 className="font-semibold text-[#151923]">After a quote is accepted</h2>
      <p>Cancellation, refunds, and payment for work already performed follow the milestones and terms in the accepted written quote. Where the quote is silent, the parties agree a fair settlement in writing before handover.</p>
      <h2 className="font-semibold text-[#151923]">Third-party costs</h2>
      <p>Non-recoverable third-party expenses already incurred (domains, licences, API usage) are not refundable through the studio.</p>
    </PolicyShell>
  );
}
