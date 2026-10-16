import type { Metadata } from "next";
import Link from "next/link";
import { approvedWork } from "@/config/work";
import { siteConfig } from "@/config/site";
import { ButtonLink, Card, Chip, Eyebrow, PageHero, Tick } from "@/components/ui/primitives";
import { Reveal } from "@/components/motion/Reveal";

export const metadata: Metadata = { title: "Work", description: "Approved client work and clearly labelled concept projects." };

export default function WorkPage() {
  const items = approvedWork();
  const real = items.filter((w) => !w.isConcept);
  const concepts = items.filter((w) => w.isConcept);

  return (
    <>
      <PageHero
        eyebrow={<Eyebrow>Work</Eyebrow>}
        folio="DOC 04 / WORK"
        title="Work we can show"
        lead="Only real, approved projects — or pieces clearly labelled as concepts. We never invent clients, results, or testimonials."
        meta={[
          { k: "Client case studies", v: real.length === 0 ? "None published yet" : `${real.length} published` },
          { k: "Concept pieces", v: `${concepts.length} self-initiated` },
          { k: "Permission", v: "Written client approval before publishing" },
        ]}
        cta={<ButtonLink href="/start-project">{siteConfig.primaryCta}</ButtonLink>}
      />

      <section className="band py-20 md:py-28">
        <div className="container-studio space-y-16">
          <div>
            <h2 className="display-h2 text-[24px]">
              Client work{real.length === 0 && <span className="text-[var(--ink-3)]"> — none published yet</span>}
            </h2>
            {real.length === 0 ? (
              <Reveal className="mt-6">
                <Card className="max-w-[66ch] bg-[var(--surface-2)]">
                  <p className="text-[15px] font-semibold">We publish nothing without written permission.</p>
                  <p className="mt-2 text-[14.5px] leading-relaxed text-[var(--ink-2)]">
                    No approved client case studies yet. They will appear here once clients approve them — until then,
                    the concept piece below shows how we compose and build.
                  </p>
                </Card>
              </Reveal>
            ) : (
              <ol className="mt-6 border-t border-[var(--line)]">
                {real.map((w, i) => (
                  <Reveal as="li" key={w.slug} delay={i * 70} className="border-b border-[var(--line)]">
                    <WorkRow slug={w.slug} title={w.title} summary={w.summary} index={i} isConcept={false} tags={w.stack} />
                  </Reveal>
                ))}
              </ol>
            )}
          </div>

          {concepts.length > 0 && (
            <div>
              <h2 className="display-h2 text-[24px]">Concept &amp; self-initiated</h2>
              <p className="mt-3 max-w-[62ch] text-[14.5px] leading-relaxed text-[var(--ink-2)]">
                Built to validate this platform&rsquo;s own design system and enquiry flow. Labelled as concepts
                everywhere they appear — no client, metric, or testimonial is implied.
              </p>
              <ol className="mt-6 border-t border-[var(--line)]">
                {concepts.map((w, i) => (
                  <Reveal as="li" key={w.slug} delay={i * 70} className="border-b border-[var(--line)]">
                    <WorkRow slug={w.slug} title={w.title} summary={w.summary} index={i} isConcept tags={w.stack} />
                  </Reveal>
                ))}
              </ol>
            </div>
          )}
        </div>
      </section>
    </>
  );
}

function WorkRow({
  slug,
  title,
  summary,
  index,
  isConcept,
  tags,
}: {
  slug: string;
  title: string;
  summary: string;
  index: number;
  isConcept: boolean;
  tags: string[];
}) {
  return (
    <Link
      href={`/work/${slug}`}
      className="group grid gap-x-8 gap-y-4 py-8 transition-colors hover:bg-[var(--surface-2)] md:grid-cols-[200px_1fr]"
    >
      <div>
        <div className="flex items-center gap-3">
          <span className="meta">{String(index + 1).padStart(2, "0")}</span>
          {isConcept ? <Chip>Concept · self-initiated</Chip> : <Chip className="!border-[var(--ok)] !text-[var(--ok)]">Client work</Chip>}
        </div>
        <ul className="mt-4 space-y-1.5">
          {tags.map((t) => (
            <li key={t} className="flex items-start gap-2 text-[13px] text-[var(--ink-3)]">
              <Tick tone="muted" />
              {t}
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h3 className="display-h3 text-[19px] transition-colors group-hover:text-[var(--accent)]">{title}</h3>
        <p className="mt-2 max-w-[68ch] text-[14.5px] leading-relaxed text-[var(--ink-2)]">{summary}</p>
        <span className="mt-4 inline-flex items-center gap-2 text-[13.5px] font-semibold text-[var(--accent)]">
          Read case study
          <span aria-hidden className="transition-transform duration-300 group-hover:translate-x-1">
            →
          </span>
        </span>
      </div>
    </Link>
  );
}
