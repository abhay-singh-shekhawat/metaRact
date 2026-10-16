import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { getWork } from "@/config/work";
import { getServiceAny } from "@/config/services";
import { siteConfig } from "@/config/site";
import { ButtonLink, Card, Chip, PageHero, Tick } from "@/components/ui/primitives";
import { Reveal } from "@/components/motion/Reveal";

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
      <PageHero
        folio={`DOC 05 / ${w.slug.toUpperCase()}`}
        title={w.title}
        lead={w.summary}
        meta={[
          { k: "Type", v: w.isConcept ? "Concept — self-initiated" : "Client work" },
          { k: "Services", v: w.serviceSlugs.map((s) => getServiceAny(s)?.title ?? s).join(", ") },
          { k: "Published", v: w.publishedAt ?? "—" },
        ]}
        cta={
          <>
            <ButtonLink href="/start-project">Start a similar project</ButtonLink>
            <ButtonLink href="/work" variant="secondary">
              All work
            </ButtonLink>
          </>
        }
      />

      <section className="band py-20 md:py-28">
        <div className="container-studio grid gap-12 lg:grid-cols-[1.5fr_1fr] lg:gap-16">
          <div className="space-y-10">
            {w.isConcept && (
              <p
                role="note"
                className="border-l-2 border-[var(--warn)] bg-[var(--warn-soft)] px-5 py-4 text-[14px] font-medium leading-relaxed text-[var(--warn)]"
              >
                Concept project — a self-initiated demonstration, not client work. No client, metrics, or testimonial is implied.
              </p>
            )}

            <Reveal>
              <h2 className="display-h2 text-[24px]">What this demonstrates</h2>
              <ul className="mt-6 border-t border-[var(--line)]">
                {w.outcome.map((o) => (
                  <li key={o} className="flex items-start gap-3 border-b border-[var(--line)] py-4 text-[14.5px]">
                    <Tick />
                    {o}
                  </li>
                ))}
              </ul>
            </Reveal>

            <Reveal>
              <h2 className="display-h2 text-[24px]">Stack</h2>
              <ul className="mt-5 flex flex-wrap gap-2">
                {w.stack.map((s) => (
                  <li key={s}>
                    <Chip>{s}</Chip>
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>

          <aside className="space-y-5 lg:sticky lg:top-28 lg:self-start">
            <Card>
              <p className="meta">Services used</p>
              <ul className="mt-3 divide-y divide-[var(--line)] text-[14px]">
                {w.serviceSlugs.map((s) => {
                  const svc = getServiceAny(s);
                  return (
                    <li key={s} className="py-2.5">
                      {svc ? (
                        <Link className="link-inline" href={`/services/${s}`}>
                          {svc.title}
                        </Link>
                      ) : (
                        s
                      )}
                    </li>
                  );
                })}
              </ul>
            </Card>

            <Card className="border-[var(--ink)] bg-[var(--ink)] text-white">
              <p className="display-h3 text-white">Want something like this?</p>
              <p className="mt-2 text-[14px] leading-relaxed text-white/70">
                Describe your version — we scope and quote by hand.
              </p>
              <Link href="/start-project" className="btn-onink mt-5 w-full">
                {siteConfig.primaryCta}
              </Link>
            </Card>
          </aside>
        </div>
      </section>
    </>
  );
}
