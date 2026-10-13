import Link from "next/link";
import { enabledServices } from "@/config/services";
import { footerLegal, primaryNav } from "@/config/navigation";
import { siteConfig } from "@/config/site";

export function Footer() {
  return (
    <footer className="mt-24 border-t border-[var(--line)] bg-white">
      <div className="container-studio grid gap-10 py-14 md:grid-cols-[1.2fr_1fr_1fr_1fr]">
        <div>
          <p className="text-[15px] font-semibold">{siteConfig.studioName}</p>
          <p className="mt-2 max-w-[36ch] text-[14px] leading-relaxed text-[#596273]">
            {siteConfig.tagline} Every enquiry is reviewed by a human — no instant quotes, no fake urgency.
          </p>
          <Link
            href="/start-project"
            className="mt-5 inline-flex min-h-[44px] items-center rounded-[10px] bg-[#151923] px-5 text-[14px] font-semibold text-white hover:bg-black"
          >
            {siteConfig.primaryCta}
          </Link>
        </div>
        <nav aria-label="Studio">
          <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[#596273]">Studio</p>
          <ul className="mt-3 space-y-2 text-[14px]">
            {primaryNav.map((n) => (
              <li key={n.href}>
                <Link className="text-[#151923] hover:underline" href={n.href}>
                  {n.label}
                </Link>
              </li>
            ))}
            <li>
              <Link className="text-[#151923] hover:underline" href="/contact">
                Contact
              </Link>
            </li>
            <li>
              <Link className="text-[#151923] hover:underline" href="/faq">
                FAQ
              </Link>
            </li>
          </ul>
        </nav>
        <nav aria-label="Services">
          <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[#596273]">Services</p>
          <ul className="mt-3 space-y-2 text-[14px]">
            {enabledServices().map((s) => (
              <li key={s.slug}>
                <Link className="text-[#151923] hover:underline" href={`/services/${s.slug}`}>
                  {s.title}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <nav aria-label="Legal">
          <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[#596273]">Legal</p>
          <ul className="mt-3 space-y-2 text-[14px]">
            {footerLegal.map((n) => (
              <li key={n.href}>
                <Link className="text-[#151923] hover:underline" href={n.href}>
                  {n.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      <div className="border-t border-[var(--line)]">
        <div className="container-studio flex flex-col gap-1 py-5 text-[13px] text-[#596273] md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} {siteConfig.studioName}. All rights reserved.</p>
          <p>Prices and timelines are quoted per scope after human review.</p>
        </div>
      </div>
    </footer>
  );
}
