import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { getWork } from "@/config/work";
import { getServiceAny } from "@/config/services";
import { siteConfig } from "@/config/site";
import { ButtonLink, Card, PageHero } from "@/components/ui/primitives";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const w = getWork(slug);
  if (!w) return { title: "Work not found" };
  return { title: w.title, description: w.summary };
}

export default async function WorkDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const w = getWork(slug);
  if (!w) notFound();
  return (
    <>
      <PageHero title={w.title} lead={w.summary} cta={<><ButtonLink href="/start-project">Start a similar project</ButtonLink><ButtonLink href="/work" variant="ghost">All work</ButtonLink></>} />
      <div className="container-studio grid gap-6 py-12 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-6">
          {w.isConcept && (
            <p role="note" className="rounded-[12px] border border-[#E8C547] bg-[#FFF8E1] p-4 text-[14px] font-medium text-[#6b4e00]">
              Concept project — a self-initiated demonstration, not client work. No client, metrics, or testimonial is implied.
            </p>
          )}
          <Card>
            <h2 className="text-[17px] font-semibold">What this demonstrates</h2>
            <ul className="mt-3 space-y-2 text-[14.5px]">
              {w.outcome.map((o) => (
                <li key={o} className="flex gap-2"><span aria-hidden className="text-[#157347]">✓</span>{o}</li>
              ))}
            </ul>
          </Card>
          <Card>
            <h2 className="text-[17px] font-semibold">Stack</h2>
            <p className="mt-2 text-[14.5px] text-[#596273]">{w.stack.join(" · ")}</p>
          </Card>
        </div>
        <aside className="space-y-5">
          <Card>
            <h2 className="text-[16px] font-semibold">Services used</h2>
            <ul className="mt-2 space-y-2 text-[14px]">
              {w.serviceSlugs.map((s) => {
                const svc = getServiceAny(s);
                return <li key={s}>{svc ? <Link className="text-[#315BE8] hover:underline" href={`/services/${s}`}>{svc.title}</Link> : s}</li>;
              })}
            </ul>
          </Card>
          <Card className="bg-[#151923] text-white border-[#151923]">
            <p className="font-semibold">Want something like this?</p>
            <p className="mt-1 text-[14px] text-white/70">Describe your version — we scope and quote by hand.</p>
            <Link href="/start-project" className="mt-4 inline-flex min-h-[44px] items-center rounded-[10px] bg-white px-5 text-[14px] font-semibold text-[#151923]">{siteConfig.primaryCta}</Link>
          </Card>
        </aside>
      </div>
    </>
  );
}
