import Link from "next/link";
import { primaryNav } from "@/config/navigation";
import { siteConfig } from "@/config/site";

const routes = [...primaryNav, { href: "/contact", label: "Contact" }, { href: "/faq", label: "FAQ" }];

export default function NotFound() {
  return (
    <section className="relative overflow-hidden border-b border-[var(--line)] bg-[var(--surface)]">
      <div aria-hidden className="grid-backdrop pointer-events-none absolute inset-0 opacity-60" />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 -top-32 h-[420px] w-[420px] rounded-full"
        style={{ background: "radial-gradient(circle, rgba(42,60,240,0.10), transparent 68%)" }}
      />
      <div className="container-studio relative grid gap-12 pt-16 pb-20 md:grid-cols-[1.15fr_0.85fr] md:items-start md:pt-24 md:pb-28">
        <div>
          <p className="meta text-[var(--accent)]">404 · Not found</p>
          <h1 className="display-h1 mt-5 max-w-[22ch] text-balance">This page isn&apos;t here.</h1>
          <p className="lead mt-5 max-w-[52ch]">
            The page you&apos;re looking for doesn&apos;t exist or was moved. Nothing else is affected —
            the rest of the site still works.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/" className="btn-primary">
              Home
            </Link>
            <Link href="/start-project" className="btn-secondary">
              {siteConfig.primaryCta}
            </Link>
          </div>
        </div>

        <nav aria-label="Site sections" className="w-full border-t border-[var(--line)]">
          <p className="meta py-3">Where to go next</p>
          <ul>
            {routes.map((n) => (
              <li key={n.href} className="border-t border-[var(--line)]">
                <Link
                  href={n.href}
                  className="flex min-h-[44px] items-center justify-between gap-6 py-3 text-[14.5px] text-[var(--ink-2)] transition-colors hover:text-[var(--ink)]"
                >
                  {n.label}
                  <span aria-hidden className="text-[var(--ink-3)]">
                    →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </section>
  );
}
