import type { Metadata } from "next";
import Link from "next/link";
import { ButtonLink, Dash, Eyebrow, PageHero, Panel, Section } from "@/components/ui/primitives";
import { Reveal } from "@/components/motion/Reveal";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = { title: "Contact", description: "Approved contact channels and the project enquiry form." };

export default function ContactPage() {
  const email = siteConfig.contactEmail;

  return (
    <>
      <PageHero
        eyebrow={<Eyebrow>Contact</Eyebrow>}
        folio="DOC 09 / CONTACT"
        title="Contact"
        lead="For project enquiries, the form is fastest — it creates a tracked reference. For anything else, use the channels below."
        meta={[
          { k: "Fastest route", v: "The project form" },
          { k: "On submit", v: "A tracked reference number" },
          { k: "Reply", v: "By hand, from your contact details" },
          { k: "Sensitive data", v: "Never send passwords or keys" },
        ]}
      />

      {/* ── Two channels, deliberately unequal ────────────────────────────── */}
      <Section tone="plain">
        <div className="container-studio grid gap-10 md:grid-cols-[1.15fr_0.85fr] md:gap-14">
          <Reveal className="min-w-0">
            <Panel ink className="flex h-full flex-col p-8 md:p-10">
              <p className="meta !text-white/55">Project enquiries</p>
              <h2 className="display-h2 mt-4 text-[26px] text-white">Start a project</h2>
              <p className="mt-4 max-w-[44ch] text-[15px] leading-relaxed">
                Two minutes, plain language, tracked reference number, human reply.
              </p>
              <div className="mt-8 pt-2 md:mt-auto md:pt-10">
                <ButtonLink href="/start-project" variant="onInk">
                  {siteConfig.primaryCta}
                </ButtonLink>
              </div>
            </Panel>
          </Reveal>

          <Reveal delay={80} className="flex min-w-0 flex-col">
            <h2 className="display-h3 text-[19px]">Direct channels</h2>
            <div className="mt-4 flex-1 border-t border-[var(--line)]">
              {email ? (
                <Link href={`mailto:${email}`} className="flex min-h-[44px] items-center py-2">
                  <span className="link-inline text-[15px] [overflow-wrap:anywhere]">{email}</span>
                </Link>
              ) : (
                <p className="max-w-[42ch] py-3 text-[15px] leading-relaxed text-[var(--ink-2)]">
                  Public contact email will appear here once approved. Meanwhile, please use the project
                  form.
                </p>
              )}

              {siteConfig.whatsappUrl && (
                <Link
                  href={siteConfig.whatsappUrl}
                  className="flex min-h-[44px] items-center border-t border-[var(--line)] py-2"
                >
                  <span className="link-inline text-[15px]">WhatsApp</span>
                </Link>
              )}
            </div>

            <p className="mt-6 flex items-start gap-2.5 text-[13.5px] leading-relaxed text-[var(--ink-3)]">
              <Dash />
              <span>
                Please don&apos;t send passwords, API keys, or sensitive personal data by any channel.
              </span>
            </p>
          </Reveal>
        </div>
      </Section>
    </>
  );
}
