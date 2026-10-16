import type { Metadata } from "next";
import { Eyebrow, PageHero, Section } from "@/components/ui/primitives";
import { Reveal } from "@/components/motion/Reveal";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = { title: "About", description: "A small three-founder digital-services studio. Details appear once approved." };

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow={<Eyebrow>About</Eyebrow>}
        folio="DOC 07 / ABOUT"
        title={`About ${siteConfig.studioName}`}
        lead="A small digital-services studio: websites, custom software, product design, brand assets, and practical AI integrations — each scoped in writing and quoted by a human."
        meta={[
          { k: "Team", v: "Three people, direct contact" },
          { k: "Capacity", v: "A few scoped projects at a time" },
          { k: "Agreements", v: "Written scope, then a human quote" },
          { k: "Handover", v: "Clean, as the quote states" },
          { k: "Bios", v: "Published once approved" },
        ]}
      />

      {/* ── One statement, and a lot of quiet around it ───────────────────── */}
      <Section tone="plain">
        <div className="container-studio">
          <Reveal>
            <p className="display-h2 max-w-[30ch] text-[1.75rem] leading-[1.15] text-balance md:max-w-[34ch] md:text-[2.3rem]">
              We are a three-person team. You talk to the people doing the work.
            </p>
          </Reveal>
        </div>
      </Section>

      {/* ── Two hairline-divided columns; nothing else on the page ─────────── */}
      <Section tone="surface">
        <div className="container-studio grid md:grid-cols-2">
          <Reveal className="border-t border-[var(--line)] py-8 md:pr-12">
            <h2 className="display-h3 text-[19px]">How we work</h2>
            <p className="mt-3 max-w-[46ch] text-[15px] leading-relaxed text-[var(--ink-2)]">
              We take on a small number of scoped projects at a time, confirm everything in writing, and
              hand over cleanly.
            </p>
          </Reveal>
          <Reveal delay={80} className="border-t border-[var(--line)] py-8 md:border-l md:pl-12">
            <h2 className="display-h3 text-[19px]">Founders</h2>
            <p className="mt-3 max-w-[46ch] text-[15px] leading-relaxed text-[var(--ink-2)]">
              Founder names, roles, and profiles will appear here once approved for publication. We
              don&apos;t invent team bios.
            </p>
          </Reveal>
        </div>
      </Section>
    </>
  );
}
