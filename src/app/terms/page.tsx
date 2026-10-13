import { PolicyShell, policyLayout } from "@/components/marketing/PolicyShell";

export const metadata = policyLayout("Terms of Service", "Terms governing use of the studio website and enquiry process.");

export default function TermsPage() {
  return (
    <PolicyShell title="Terms of service" lead="The website is an enquiry channel. Submitting a brief is not an order, and our reply is not a quote until a written scope is agreed.">
      <h2 className="font-semibold text-[#151923]">Enquiries are not orders</h2>
      <p>Submitting the project form creates a tracked enquiry for human review. It does not reserve capacity, fix a price, promise a deadline, or create a contract for services.</p>
      <h2 className="font-semibold text-[#151923]">Quotes govern work</h2>
      <p>Work begins only under a written quote or agreement stating scope, deliverables, exclusions, fees, milestones, and handover. Marketing pages never override a signed quote.</p>
      <h2 className="font-semibold text-[#151923]">Acceptable use</h2>
      <p>Do not submit unlawful content, other people&apos;s personal data without permission, secrets or credentials, or malicious links. We may decline or delete abusive submissions.</p>
      <h2 className="font-semibold text-[#151923]">Intellectual property</h2>
      <p>Site content is the studio&apos;s unless stated otherwise. See the IP &amp; portfolio page for portfolio-use terms.</p>
    </PolicyShell>
  );
}
