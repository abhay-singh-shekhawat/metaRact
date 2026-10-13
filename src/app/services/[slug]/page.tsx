import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { getServiceAny, enabledServices } from "@/config/services";
import { getWork } from "@/config/work";
import { siteConfig } from "@/config/site";
import { ButtonLink, Card, PageHero } from "@/components/ui/primitives";

export async function generateStaticParams() {
  return enabledServices().map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const s = getServiceAny(slug);
  if (!s || !s.enabled) return { title: "Service not found" };
  return { title: s.seoTitle, description: s.seoDescription };
}

export default async function ServiceDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const s = getServiceAny(slug);
  if (!s || !s.enabled) notFound();
  const related = s.relatedWorkSlugs.map(getWork).filter(Boolean);
  return (
    <>
      <PageHero
        title={s.title}
        lead={s.longDescription}
        cta={<><ButtonLink href={`/start-project?service=${s.slug}`}>Start a {s.title} enquiry</ButtonLink><ButtonLink href="/services" variant="ghost">All services</ButtonLink></>}
      />
      <div className="container-studio grid gap-6 py-12 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-6">
          <Card>
            <h2 className="text-[18px] font-semibold">What you can expect back</h2>
            <ul className="mt-3 space-y-2 text-[14.5px]">
              {s.deliverables.map((d) => (
                <li key={d} className="flex gap-2"><span aria-hidden className="text-[#157347]">✓</span>{d}</li>
              ))}
            </ul>
          </Card>
          <Card>
            <h2 className="text-[18px] font-semibold">Not automatically included</h2>
            <ul className="mt-3 space-y-2 text-[14.5px] text-[#596273]">
              {s.exclusions.map((e) => (
                <li key={e} className="flex gap-2"><span aria-hidden>—</span>{e}</li>
              ))}
            </ul>
            <p className="mt-3 text-[13.5px] text-[#596273]">Third-party costs (domains, hosting, licences, API usage) are separate unless a written quote includes them.</p>
          </Card>
          <div>
            <h2 className="text-[18px] font-semibold">Questions we hear</h2>
            <div className="mt-3 space-y-3">
              {s.faq.map((f) => (
                <details key={f.q} className="rounded-[12px] border border-[var(--line)] bg-white p-5">
                  <summary className="cursor-pointer list-none font-semibold [&::-webkit-details-marker]:hidden">{f.q}</summary>
                  <p className="mt-2 text-[14.5px] text-[#596273]">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </div>
        <aside className="space-y-5">
          <Card className="bg-[#151923] text-white border-[#151923]">
            <h2 className="text-[16px] font-semibold">Request an estimate</h2>
            <p className="mt-1 text-[14px] text-white/70">Describe the outcome. We confirm scope, then a human quotes it.</p>
            <Link href={`/start-project?service=${s.slug}`} className="mt-4 inline-flex min-h-[44px] items-center rounded-[10px] bg-white px-5 text-[14px] font-semibold text-[#151923]">{siteConfig.primaryCta}</Link>
          </Card>
          {related.length > 0 && (
            <Card>
              <h2 className="text-[16px] font-semibold">Related work</h2>
              <ul className="mt-2 space-y-2 text-[14px]">
                {related.map((w) => w && (
                  <li key={w.slug}><Link className="text-[#315BE8] hover:underline" href={`/work/${w.slug}`}>{w.title}</Link></li>
                ))}
              </ul>
            </Card>
          )}
        </aside>
      </div>
    </>
  );
}
