import Link from "next/link";
import { enabledServices } from "@/config/services";
import { StudioWordmark } from "@/components/marketing/StudioWordmark";
import { footerLegal, primaryNav } from "@/config/navigation";
import { siteConfig } from "@/config/site";

export function Footer() {
  return (
    <footer className="mt-24 border-t border-[var(--line)] bg-[var(--surface)]">
      <div className="container-studio py-16 md:py-20">
        <div className="grid gap-12 lg:grid-cols-[1.3fr_1fr]">
          <div>
            <p className="eyebrow">The studio</p>
            <p className="display-h2 mt-4 max-w-[18ch] text-balance">
              Two paragraphs in, one honest reply out.
            </p>
            <p className="mt-4 max-w-[46ch] text-[15px] leading-relaxed text-[var(--ink-2)]">
              {siteConfig.tagline} Every enquiry is read by a person — no instant quotes, no fake urgency,
              no invented clients.
            </p>
            <Link href="/start-project" className="btn-primary mt-7">
              {siteConfig.primaryCta}
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            <nav aria-label="Studio">
              <p className="meta">Studio</p>
              <ul className="mt-4 space-y-2.5 text-[14px]">
                {primaryNav.map((n) => (
                  <li key={n.href}>
                    <Link className="text-[var(--ink-2)] transition-colors hover:text-[var(--ink)]" href={n.href}>
                      {n.label}
                    </Link>
                  </li>
                ))}
                <li>
                  <Link className="text-[var(--ink-2)] transition-colors hover:text-[var(--ink)]" href="/contact">
                    Contact
                  </Link>
                </li>
                <li>
                  <Link className="text-[var(--ink-2)] transition-colors hover:text-[var(--ink)]" href="/faq">
                    FAQ
                  </Link>
                </li>
              </ul>
            </nav>
            <nav aria-label="Services">
              <p className="meta">Services</p>
              <ul className="mt-4 space-y-2.5 text-[14px]">
                {enabledServices().map((s) => (
                  <li key={s.slug}>
                    <Link className="text-[var(--ink-2)] transition-colors hover:text-[var(--ink)]" href={`/services/${s.slug}`}>
                      {s.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
            <nav aria-label="Legal">
              <p className="meta">Legal</p>
              <ul className="mt-4 space-y-2.5 text-[14px]">
                {footerLegal.map((n) => (
                  <li key={n.href}>
                    <Link className="text-[var(--ink-2)] transition-colors hover:text-[var(--ink)]" href={n.href}>
                      {n.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </div>

        {/* The studio signature, drawn rather than set (see
            THIRD-PARTY-NOTICES.md). */}
        <div className="mt-14">
          <StudioWordmark />
        </div>
      </div>

      <div className="border-t border-[var(--line)]">
        <div className="container-studio flex flex-col gap-2 py-5 text-[13px] text-[var(--ink-3)] md:flex-row md:items-center md:justify-between">
          <p>
            © {new Date().getFullYear()} {siteConfig.studioName}. All rights reserved.
          </p>
          <p>Prices and timelines are quoted per scope, after human review.</p>
        </div>
      </div>
    </footer>
  );
}
