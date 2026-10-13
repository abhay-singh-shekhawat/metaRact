import type { Metadata } from "next";
import Link from "next/link";
import { approvedWork } from "@/config/work";
import { siteConfig } from "@/config/site";
import { PageHero, ButtonLink } from "@/components/ui/primitives";

export const metadata: Metadata = { title: "Work", description: "Approved client work and clearly labelled concept projects." };

export default function WorkPage() {
  const items = approvedWork();
  const real = items.filter((w) => !w.isConcept);
  const concepts = items.filter((w) => w.isConcept);
  return (
    <>
      <PageHero
        title="Work we can show"
        lead="Only real, approved projects — or pieces clearly labelled as concepts. We never invent clients, results, or testimonials."
        cta={<ButtonLink href="/start-project">{siteConfig.primaryCta}</ButtonLink>}
      />
      <div className="container-studio space-y-10 py-12">
        <section aria-label="Client work">
          <h2 className="text-[19px] font-semibold">Client work {real.length === 0 && "(none published yet)"}</h2>
          {real.length === 0 ? (
            <p className="mt-2 max-w-[62ch] text-[14.5px] text-[#596273]">
              No approved client case studies yet. We will publish them here once clients approve — until then, the concept below shows how we compose and build.
            </p>
          ) : (
            <div className="mt-4 grid gap-5 md:grid-cols-2">
              {real.map((w) => (
                <WorkCard key={w.slug} slug={w.slug} title={w.title} summary={w.summary} isConcept={false} />
              ))}
            </div>
          )}
        </section>
        {concepts.length > 0 && (
          <section aria-label="Concept work">
            <h2 className="text-[19px] font-semibold">Concept & self-initiated</h2>
            <div className="mt-4 grid gap-5 md:grid-cols-2">
              {concepts.map((w) => (
                <WorkCard key={w.slug} slug={w.slug} title={w.title} summary={w.summary} isConcept />
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}

function WorkCard({ slug, title, summary, isConcept }: { slug: string; title: string; summary: string; isConcept: boolean }) {
  return (
    <Link href={`/work/${slug}`} className="rounded-[16px] border border-[var(--line)] bg-white p-7 hover:shadow-[0_8px_30px_rgba(21,25,35,0.08)]">
      {isConcept && (
        <span className="inline-block rounded-full bg-[#FFF4D6] px-2.5 py-1 text-[12px] font-semibold text-[#8a5a00]">
          Concept project · Self-initiated demo
        </span>
      )}
      <h3 className="mt-3 text-[18px] font-semibold">{title}</h3>
      <p className="mt-2 text-[14.5px] text-[#596273]">{summary}</p>
      <span className="mt-3 inline-block text-[13.5px] font-semibold text-[#315BE8]">Read case study →</span>
    </Link>
  );
}
