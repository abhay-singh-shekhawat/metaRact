import type { Metadata } from "next";
import { approvedWork } from "@/config/work";
import { siteConfig } from "@/config/site";
import { ButtonLink, Card, Eyebrow, PageHero } from "@/components/ui/primitives";
import { Reveal } from "@/components/motion/Reveal";
import { WorkRow } from "@/components/marketing/WorkRow";

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
          { k: "Visuals", v: "Generated plates, never fake screenshots" },
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
                    <WorkRow item={w} index={i} isConcept={false} />
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
                    <WorkRow item={w} index={i} isConcept />
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
