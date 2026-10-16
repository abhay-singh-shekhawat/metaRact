import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { getServiceAny, enabledServices } from "@/config/services";
import { getWork } from "@/config/work";
import { siteConfig } from "@/config/site";
import { ButtonLink, Card, Dash, Eyebrow, PageHero, Tick } from "@/components/ui/primitives";
import { Reveal } from "@/components/motion/Reveal";

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
  const index = enabledServices().findIndex((x) => x.slug === s.slug) + 1;

  return (
    <>
      <PageHero
        eyebrow={<Eyebrow>Service · 0{index}</Eyebrow>}
        folio={`DOC 02 / ${s.slug.toUpperCase()}`}
        title={s.title}
        lead={s.longDescription}
        meta={[
          { k: "Deliverables", v: `${s.deliverables.length} agreed outputs` },
          { k: "Priced", v: "By a human, after the scope is written" },
          { k: "Third-party costs", v: "Listed separately, never bundled" },
        ]}
        cta={
          <>
            <ButtonLink href={`/start-project?service=${s.slug}`}>Start a {s.title} enquiry</ButtonLink>
            <ButtonLink href="/services" variant="secondary">
              All services
            </ButtonLink>
          </>
        }
      />

      <section className="band py-20 md:py-28">
        <div className="container-studio grid gap-12 lg:grid-cols-[1.5fr_1fr] lg:gap-16">
          <div className="space-y-12">
            <Reveal>
              <h2 className="display-h2 text-[24px]">What you can expect back</h2>
              <ul className="mt-6 border-t border-[var(--line)]">
                {s.deliverables.map((d) => (
                  <li key={d} className="flex items-start gap-3 border-b border-[var(--line)] py-4 text-[14.5px]">
                    <Tick />
                    {d}
                  </li>
                ))}
              </ul>
            </Reveal>

            <Reveal>
              <h2 className="display-h2 text-[24px]">Not automatically included</h2>
              <ul className="mt-6 border-t border-[var(--line)]">
                {s.exclusions.map((e) => (
                  <li key={e} className="flex items-start gap-3 border-b border-[var(--line)] py-4 text-[14.5px] text-[var(--ink-2)]">
                    <Dash />
                    {e}
                  </li>
                ))}
              </ul>
              <p className="mt-4 max-w-[62ch] text-[13.5px] leading-relaxed text-[var(--ink-3)]">
                Third-party costs (domains, hosting, licences, API usage) are separate unless a written quote includes them.
              </p>
            </Reveal>

            <Reveal>
              <h2 className="display-h2 text-[24px]">Questions we hear</h2>
              <div className="mt-6 border-t border-[var(--line)]">
                {s.faq.map((f) => (
                  <details key={f.q} className="group border-b border-[var(--line)]">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5 text-[15.5px] font-semibold [&::-webkit-details-marker]:hidden">
                      {f.q}
                      <span
                        aria-hidden
                        className="grid h-6 w-6 shrink-0 place-items-center rounded-full border border-[var(--line-2)] text-[15px] leading-none text-[var(--ink-2)] transition-transform duration-300 group-open:rotate-45"
                      >
                        +
                      </span>
                    </summary>
                    <p className="max-w-[68ch] pb-5 text-[14.5px] leading-relaxed text-[var(--ink-2)]">{f.a}</p>
                  </details>
                ))}
              </div>
            </Reveal>
          </div>

          <aside className="space-y-5 lg:sticky lg:top-28 lg:self-start">
            <Card className="border-[var(--ink)] bg-[var(--ink)] text-white">
              <h2 className="display-h3 text-white">Request an estimate</h2>
              <p className="mt-2 text-[14px] leading-relaxed text-white/70">
                Describe the outcome. We confirm scope, then a human quotes it.
              </p>
              <Link href={`/start-project?service=${s.slug}`} className="btn-onink mt-5 w-full">
                {siteConfig.primaryCta}
              </Link>
            </Card>

            <Card>
              <p className="meta">Also in services</p>
              <ul className="mt-3 divide-y divide-[var(--line)]">
                {enabledServices()
                  .filter((o) => o.slug !== s.slug)
                  .map((o) => (
                    <li key={o.slug}>
                      <Link
                        href={`/services/${o.slug}`}
                        className="flex items-baseline justify-between gap-3 py-2.5 text-[14px] text-[var(--ink-2)] transition-colors hover:text-[var(--ink)]"
                      >
                        {o.title}
                        <span aria-hidden className="text-[var(--accent)]">
                          →
                        </span>
                      </Link>
                    </li>
                  ))}
              </ul>
            </Card>

            {related.length > 0 && (
              <Card>
                <p className="meta">Related work</p>
                <ul className="mt-3 space-y-2 text-[14px]">
                  {related.map(
                    (w) =>
                      w && (
                        <li key={w.slug}>
                          <Link className="link-inline" href={`/work/${w.slug}`}>
                            {w.title}
                          </Link>
                        </li>
                      )
                  )}
                </ul>
              </Card>
            )}
          </aside>
        </div>
      </section>
    </>
  );
}
