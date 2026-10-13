import { PolicyShell, policyLayout } from "@/components/marketing/PolicyShell";

export const metadata = policyLayout("IP & Portfolio Terms", "Who owns deliverables and when the studio may show work publicly.");

export default function IpPage() {
  return (
    <PolicyShell title="IP & portfolio terms" lead="Ownership transfers as the written quote says. Public portfolio display always needs explicit permission.">
      <h2 className="font-semibold text-[#151923]">Deliverable ownership</h2>
      <p>Each quote states whether the client receives exclusive rights, editable source files, or final exports only. Until the quote says otherwise, assume final exports — not source — are the deliverable.</p>
      <h2 className="font-semibold text-[#151923]">Portfolio display</h2>
      <p>We publish client work only with explicit permission covering what may be shown (name, screenshots, description, dates). Concept work is always labelled as concept and never presented as client work.</p>
      <h2 className="font-semibold text-[#151923]">Third-party assets</h2>
      <p>Stock, fonts, and licensed media remain under their own licences. The quote states who pays for them and what usage is covered.</p>
    </PolicyShell>
  );
}
