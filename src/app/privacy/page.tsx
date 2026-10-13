import { PolicyShell, policyLayout } from "@/components/marketing/PolicyShell";

export const metadata = policyLayout("Privacy Notice", "How project enquiry data is collected, used, retained, and deleted.");

export default function PrivacyPage() {
  return (
    <PolicyShell title="Privacy notice" lead="What we collect from the project form, why, who sees it, and how long we keep it.">
      <h2 className="font-semibold text-[#151923]">What we collect</h2>
      <p>Only the fields in the project enquiry form: service, project title and summary, name, email, optional organisation and phone, contact preference, budget band and timeline preference, reference URLs, and category-specific answers. We do not ask for passwords, API keys, identity documents, or confidential datasets — please do not send them.</p>
      <h2 className="font-semibold text-[#151923]">Why</h2>
      <p>To review your request, respond to you, and scope potential work. Data minimisation applies: if we don&apos;t need it to reply, we don&apos;t ask for it.</p>
      <h2 className="font-semibold text-[#151923]">Who sees it</h2>
      <p>Only the studio&apos;s founders/administrators and the systems that store and deliver the enquiry (database, email provider). We do not sell enquiry data. Analytics events never include names, emails, briefs, or URLs.</p>
      <h2 className="font-semibold text-[#151923]">Retention</h2>
      <p>Default operational policy: unconverted or declined enquiries are deleted or anonymised after 12 months of inactivity unless a documented business or legal reason requires longer retention. Contractual and accounting records may follow a different schedule.</p>
      <h2 className="font-semibold text-[#151923]">Your requests</h2>
      <p>You may request access, correction, or deletion of your enquiry data. Response obligations depend on current Indian law (including the DPDP Act 2023 and DPDP Rules 2025 timetable) — this notice must be reviewed by a qualified professional before launch.</p>
    </PolicyShell>
  );
}
