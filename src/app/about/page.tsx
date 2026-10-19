import type { Metadata } from "next";
import { Eyebrow, PageHero, Section, SectionHeading } from "@/components/ui/primitives";
import { Reveal } from "@/components/motion/Reveal";
import { FounderCard } from "@/components/marketing/FounderCard";
import { founders } from "@/config/team";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "About",
  description:
    "A small three-founder digital-services studio: websites, custom software, product design, brand assets, and practical AI integrations.",
};

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
          { k: "Profiles", v: "LinkedIn and GitHub" },
        ]}
      />

      {/* ── The three people, as themselves ───────────────────────────────── */}
      <Section tone="paper">
        <div className="container-studio">
          <Reveal>
            <SectionHeading
              eyebrow={<Eyebrow>Founders</Eyebrow>}
              title="Three founders. Direct contact."
              lead="These profiles are our own. When you write, one of us answers."
            />
          </Reveal>

          <Reveal delay={80}>
            <ul className="founder-stage mt-12 grid gap-x-10 gap-y-10 lg:grid-cols-3">
              {founders.map((founder, i) => (
                <FounderCard key={founder.name} founder={founder} index={i + 1} />
              ))}
            </ul>
          </Reveal>
        </div>
      </Section>

      {/* ── How the studio works, stated once, as the closing idea ────────── */}
      <Section tone="surface">
        <div className="container-studio">
          <Reveal>
            <p className="meta">How we work</p>
            <p className="display-h2 mt-4 max-w-[36ch] text-[1.6rem] leading-[1.2] text-balance md:text-[2.05rem]">
              We take on a small number of scoped projects at a time, confirm everything in writing,
              and hand over cleanly.
            </p>
          </Reveal>
        </div>
      </Section>
    </>
  );
}
