import type { Metadata } from "next";
import Link from "next/link";
import { ButtonLink, Dash, Eyebrow, PageHero, Panel, Section } from "@/components/ui/primitives";
import { CopyHandle } from "@/components/ui/CopyHandle";
import { Reveal } from "@/components/motion/Reveal";
import { founders } from "@/config/team";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Contact",
  description: "The studio inbox, the founders' WhatsApp usernames, and the project enquiry form.",
};

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

      <Section tone="plain">
        <div className="container-studio">
          {/* ── Two channels, deliberately unequal ────────────────────────── */}
          <div className="grid gap-10 md:grid-cols-[1.15fr_0.85fr] md:gap-14">
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
              <div className="mt-4 border-t border-[var(--line)]">
                {email ? (
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--line)] py-3">
                    <div className="min-w-0">
                      <p className="meta">Studio email</p>
                      <Link href={`mailto:${email}`} className="mt-1 inline-block">
                        <span className="link-inline text-[15px] [overflow-wrap:anywhere]">{email}</span>
                      </Link>
                    </div>
                    <CopyHandle value={email} label="Copy the studio email address" />
                  </div>
                ) : (
                  <p className="max-w-[42ch] border-b border-[var(--line)] py-3 text-[15px] leading-relaxed text-[var(--ink-2)]">
                    Public contact email will appear here once approved. Meanwhile, please use the
                    project form.
                  </p>
                )}

                {siteConfig.whatsappUrl && (
                  <Link
                    href={siteConfig.whatsappUrl}
                    className="flex min-h-[44px] items-center border-b border-[var(--line)] py-2"
                  >
                    <span className="link-inline text-[15px]">WhatsApp</span>
                  </Link>
                )}
              </div>

              <p className="mt-6 flex items-start gap-2.5 text-[13.5px] leading-relaxed text-[var(--ink-3)]">
                <Dash />
                <span>
                  Please don&apos;t send passwords, API keys, or sensitive personal data by any
                  channel.
                </span>
              </p>
            </Reveal>
          </div>

          {/* ── The founders, on the channel most people actually use ─────── */}
          <div className="mt-14 border-t border-[var(--line)] pt-8">
            <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
              <h2 className="display-h3 text-[19px]">Founders on WhatsApp</h2>
              <p className="meta">Usernames, not phone numbers</p>
            </div>

            <ul className="mt-6 grid gap-x-10 gap-y-6 sm:grid-cols-3">
              {founders.map((founder) => (
                <li
                  key={founder.name}
                  className="flex flex-col gap-2.5 border-t border-[var(--line)] pt-4"
                >
                  <p className="text-[14.5px] font-medium text-[var(--ink)]">{founder.name}</p>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                    <span className="font-mono text-[13.5px] text-[var(--ink-2)] [overflow-wrap:anywhere]">
                      {founder.whatsapp}
                    </span>
                    <CopyHandle
                      value={founder.whatsapp}
                      label={`Copy ${founder.name}'s WhatsApp username`}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Section>
    </>
  );
}
