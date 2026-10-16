import type { Metadata } from "next";
import Link from "next/link";
import { enabledServices } from "@/config/services";
import { siteConfig } from "@/config/site";
import { ButtonLink, Eyebrow, PageHero, Panel, Tick } from "@/components/ui/primitives";
import { Reveal } from "@/components/motion/Reveal";
import { Tilt } from "@/components/motion/Tilt";

export const metadata: Metadata = {
  title: "Services",
  description: "Five outcome-led service groups: websites, software, design, AI, and brand assets.",
};

export default function ServicesPage() {
  const services = enabledServices();

  return (
    <>
      <PageHero
        eyebrow={<Eyebrow>Services</Eyebrow>}
        folio="DOC 01 / SERVICES"
        title="Services shaped around outcomes"
        lead="Pick the closest starting point. If your project spans groups, say so in the brief — a human routes it, not a dropdown."
        meta={[
          { k: "Groups", v: `${services.length} outcome-led services` },
          { k: "Entry point", v: "One service in the brief; explain the rest" },
          { k: "Routing", v: "Reviewed by a person, not a dropdown" },
        ]}
        cta={
          <>
            <ButtonLink href="/start-project">{siteConfig.primaryCta}</ButtonLink>
            <ButtonLink href="/pricing" variant="secondary">
              How pricing works
            </ButtonLink>
          </>
        }
      />

      <section className="band py-20 md:py-28">
        <div className="container-studio">
          <div className="grid gap-4 sm:grid-cols-2">
            {services.map((s, i) => {
              const wide = i === services.length - 1;
              return (
                <Reveal key={s.slug} delay={Math.min(i, 3) * 70} className={wide ? "sm:col-span-2" : ""}>
                  <Tilt className="h-full">
                    <Link href={`/services/${s.slug}`} className="surface-link flex h-full flex-col p-7 md:p-9">
                      <div className={`flex flex-col gap-6 ${wide ? "lg:flex-row lg:items-start lg:gap-12" : ""}`}>
                        <div className={wide ? "lg:w-[42%] lg:shrink-0" : ""}>
                          <span className="meta">0{i + 1}</span>
                          <h2 className="display-h3 mt-3 text-[20px] md:text-[22px]">{s.title}</h2>
                          {wide ? (
                            <span className="mt-4 hidden text-[13.5px] font-semibold text-[var(--accent)] lg:block">
                              Details →
                            </span>
                          ) : null}
                        </div>
                        <div className="flex-1">
                          <p className="max-w-[62ch] text-[14.5px] leading-relaxed text-[var(--ink-2)]">{s.longDescription}</p>
                          <ul className="mt-5 flex flex-wrap gap-x-6 gap-y-2">
                            {s.outcomePoints.map((o) => (
                              <li key={o} className="flex items-start gap-2 text-[13.5px] text-[var(--ink-2)]">
                                <Tick />
                                {o}
                              </li>
                            ))}
                          </ul>
                          <span className={`mt-6 inline-block text-[13.5px] font-semibold text-[var(--accent)] ${wide ? "lg:hidden" : ""}`}>
                            Details →
                          </span>
                        </div>
                      </div>
                    </Link>
                  </Tilt>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      <section className="band bg-[var(--surface)] py-20 md:py-28">
        <div className="container-studio">
          <Reveal>
            <Panel ink className="grid gap-8 p-8 md:grid-cols-[1fr_auto] md:items-center md:p-12">
              <div>
                <h2 className="display-h2 max-w-[26ch] text-white text-balance">Something else?</h2>
                <p className="mt-3 max-w-[58ch] text-[15px] leading-relaxed">
                  If it is digital and scoped, ask. If we can&apos;t do it well, we&apos;ll tell you in the first reply —
                  rather than improvising our way through your project.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link href="/contact" className="btn-onink">
                  Contact us
                </Link>
                <Link href="/start-project" className="btn-onink-outline">
                  {siteConfig.primaryCta}
                </Link>
              </div>
            </Panel>
          </Reveal>
        </div>
      </section>
    </>
  );
}
