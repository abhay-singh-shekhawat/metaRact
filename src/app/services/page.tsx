import type { Metadata } from "next";
import Link from "next/link";
import { enabledServices } from "@/config/services";
import { siteConfig } from "@/config/site";
import { PageHero, Card, ButtonLink } from "@/components/ui/primitives";

export const metadata: Metadata = { title: "Services", description: "Five outcome-led service groups: websites, software, design, AI, and brand assets." };

export default function ServicesPage() {
  return (
    <>
      <PageHero
        title="Services shaped around outcomes"
        lead="Pick the closest starting point. If your project spans groups, say so in the brief — a human routes it, not a dropdown."
        cta={<><ButtonLink href="/start-project">{siteConfig.primaryCta}</ButtonLink><ButtonLink href="/pricing" variant="ghost">How pricing works</ButtonLink></>}
      />
      <div className="container-studio grid gap-5 py-12 md:grid-cols-2">
        {enabledServices().map((s, i) => (
          <Link key={s.slug} href={`/services/${s.slug}`} className="group rounded-[16px] border border-[var(--line)] bg-white p-7 hover:shadow-[0_8px_30px_rgba(21,25,35,0.08)]">
            <p className="font-mono text-[12px] text-[#596273]">0{i + 1} · {s.slug}</p>
            <h2 className="mt-2 text-[20px] font-semibold group-hover:underline">{s.title}</h2>            <p className="mt-2 text-[14.5px] leading-relaxed text-[#596273]">{s.longDescription}</p>
            <ul className="mt-4 space-y-1.5 text-[14px]">
              {s.outcomePoints.map((o) => (
                <li key={o} className="flex gap-2"><span aria-hidden className="text-[#315BE8]">✓</span>{o}</li>
              ))}
            </ul>
            <span className="mt-4 inline-block text-[14px] font-semibold text-[#315BE8]">Details →</span>
          </Link>
        ))}
      </div>
      <div className="container-studio pb-16">
        <Card className="bg-[#151923] text-white border-[#151923]">
          <h2 className="text-[19px] font-semibold">Something else?</h2>
          <p className="mt-1 text-[14.5px] text-white/70">If it is digital and scoped, ask. If we can&apos;t do it well, we&apos;ll tell you in the first reply.</p>
          <div className="mt-4"><ButtonLink href="/contact" variant="ghost">Contact us</ButtonLink></div>
        </Card>
      </div>
    </>
  );
}
