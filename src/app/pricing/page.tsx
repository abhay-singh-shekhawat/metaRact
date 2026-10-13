import type { Metadata } from "next";
import { PageHero, Card, ButtonLink } from "@/components/ui/primitives";

export const metadata: Metadata = { title: "Pricing", description: "How we price: scope-based human quotes, planning budget bands, separate third-party costs." };

export default function PricingPage() {
  return (
    <>
      <PageHero
        title="Pricing follows scope — not the other way round"
        lead="There is no instant calculator here. You tell us the outcome, we confirm what's included, then a human prices it. Budget bands in the form are planning signals only."
        cta={<ButtonLink href="/start-project">Request an estimate</ButtonLink>}
      />
      <div className="container-studio grid gap-5 py-12 lg:grid-cols-2">
        <Card>
          <h2 className="text-[17px] font-semibold">What a quote contains</h2>
          <ul className="mt-3 space-y-2 text-[14.5px] text-[#596273]">
            {["Agreed deliverables and exclusions", "Service fee for the studio's work", "Estimated third-party expenses, listed separately", "Payment milestones and schedule assumptions", "Revision allowance and validity period"].map((x) => (
              <li key={x} className="flex gap-2"><span aria-hidden className="text-[#157347]">✓</span>{x}</li>
            ))}
          </ul>
        </Card>
        <Card>
          <h2 className="text-[17px] font-semibold">Always separate</h2>
          <ul className="mt-3 space-y-2 text-[14.5px] text-[#596273]">
            {["Domain registration and hosting", "Premium themes, plugins, stock and font licences", "Third-party API and model usage", "App-store fees and payment-provider charges", "Ongoing maintenance unless contracted"].map((x) => (
              <li key={x} className="flex gap-2"><span aria-hidden>—</span>{x}</li>
            ))}
          </ul>
        </Card>
        <Card>
          <h2 className="text-[17px] font-semibold">Budget bands (INR, planning only)</h2>
          <p className="mt-2 text-[14.5px] text-[#596273]">
            Under ₹10,000 · ₹10–30k · ₹30–75k · ₹75k–1.5L · Over ₹1.5L · Not sure · Prefer not to say.
            These help us plan the first conversation. They are not prices, promises, or discounts.
          </p>
        </Card>
        <Card className="bg-[#151923] text-white border-[#151923]">
          <h2 className="text-[17px] font-semibold">What we won&apos;t do</h2>
          <p className="mt-2 text-[14.5px] text-white/75">No binding prices before scope review. No “cheapest / guaranteed / instant” claims. No automated acceptance of work.</p>
          <div className="mt-4"><ButtonLink href="/start-project">Describe your project</ButtonLink></div>
        </Card>
      </div>
    </>
  );
}
